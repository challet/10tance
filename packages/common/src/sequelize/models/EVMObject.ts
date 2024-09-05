import type { LatLngBounds } from 'leaflet';
import { Model, DataTypes, Op } from 'sequelize';
import type { Sequelize, InferAttributes, InferCreationAttributes, FindAttributeOptions } from 'sequelize';

class EVMObject extends Model<InferAttributes<EVMObject>, InferCreationAttributes<EVMObject>> {
  declare id: Buffer;
  declare latlng: {
    x: number;
    y: number;
  }
  declare type: string;
  declare meta: {
    symbol?: string;
    name?: string;
    icon_url?: string;
    circulating_market_cap?: number;
    holders: number;
  }

  private static get COMMON_ATTRIBUTES(): FindAttributeOptions {
    const db = this.sequelize!;
    return [
      // TODO inpect why the binary data cannot be raw fetched
      // without the convert_from, it looks like something (postgre, sequelize ?) is converting it to integer representation
      [db.fn('convert_from', db.col('id'), 'utf8'), 'id'],
      [db.literal('latlng::POINT'), 'latlng'],
      'meta'
    ];
  }

  private static get COMMON_INFLUENCERS_WHERE() {
    const db = this.sequelize!;
    return [
      {id : '0x7a1263eC3Bf0a19e25C553B8A2C312e903262C5E'},
      db.literal("meta->'circulating_market_cap' IS NOT NULL"),
      db.literal("(meta->>'circulating_market_cap')::float != 0"),
      db.literal("meta->'icon_url' IS NOT NULL")
    ];
  }

  static async findAllInTile(bounds: LatLngBounds, limit: number = 30): Promise<InstanceType<EVMObjectType>[]> {
    const db = this.sequelize!;
    const tileGeom = boundsToGeom(bounds);

    return EVMObject.findAll({
      attributes: this.COMMON_ATTRIBUTES,
      where: db.literal("ST_CoveredBy(latlng, ST_GeomFromText($tileGeom))"),
      order: [
        [db.literal("COALESCE((meta#>>'{circulating_market_cap}')::FLOAT, 0)"), 'DESC'],
        [db.literal("COALESCE((meta#>>'{holders}')::FLOAT, 0)"), 'DESC']
      ],
      limit,
      bind: { tileGeom }
    });
  }

  static async findAllInfluencersInTile(bounds: LatLngBounds, limit: number = 30): Promise<InstanceType<EVMObjectType>[]> {
    const db = this.sequelize!;
    const tileGeom = boundsToGeom(bounds);

    return EVMObject.findAll({
      attributes: this.COMMON_ATTRIBUTES,
      where: {
        [Op.and]: [
          ...this.COMMON_INFLUENCERS_WHERE,
          // inside the tile
          db.literal("ST_CoveredBy(latlng, ST_GeomFromText($tileGeom))")
        ],
      },
      order: [
        [db.literal("(meta->>'circulating_market_cap')::FLOAT"), "DESC"]
      ],
      limit,
      bind: { tileGeom }
    });
  }
  
  static async findAllInfluencersOffTile(bounds: LatLngBounds, minStrength: number, limit: number = 150): Promise<InstanceType<EVMObjectType>[]> {
    const db = this.sequelize!;
    const tileGeom = boundsToGeom(bounds);

    // create a multipolygon from the original polygon, allowing to compute distances from other side of the world edges
    const wrappingMultiPolygon = await makeWrappingMultiPolygon("ST_GeomFromText($tileGeom)");

    console.log({ tileGeom, minStrength });
    return EVMObject.findAll({
      attributes: this.COMMON_ATTRIBUTES,
      where: {
        [Op.and]: [
          ...this.COMMON_INFLUENCERS_WHERE,
          // outside the tile
          db.literal("NOT ST_CoveredBy(latlng, ST_GeomFromText($tileGeom))"),
          // and with influence able to reach it
          db.literal(`LN((meta->>'circulating_market_cap')::FLOAT) / ST_Distance(latlng, ${wrappingMultiPolygon}) > $minStrength`)
        ],
      },
      order: [
        [db.literal(`LN((meta->>'circulating_market_cap')::FLOAT) / ST_Distance(latlng, ${wrappingMultiPolygon})`), "DESC"]
      ],
      limit,
      bind: { tileGeom, minStrength },
    });
  }
}


export type EVMObjectType = typeof EVMObject;

export default (db: Sequelize) => {
  return EVMObject.init({
    id: {
      type: DataTypes.BLOB,
      primaryKey: true
    },
    latlng: DataTypes.GEOMETRY('POINT'),
    type: DataTypes.ENUM('ZERO', 'ERC20'),
    meta: DataTypes.JSONB
  }, {
    sequelize: db,
    tableName: 'evm_addresses',
    modelName: 'EVMObject',
    timestamps: false
  });
};

const boundsToGeom = (bounds: LatLngBounds): string => {
  const e = bounds.getEast(),
      w = bounds.getWest(),
      n = bounds.getNorth(),
      s = bounds.getSouth();
  return `POLYGON((${e} ${s}, ${e} ${n}, ${w} ${n}, ${w} ${s}, ${e} ${s}))`;
}

// Async could be removed and dynamic import made static after [this PR](https://github.com/Leaflet/Leaflet/pull/9385) makes it to a release
const makeWrappingMultiPolygon = async (originalPolygon: string): Promise<string> => {
  const { EvmTorus } = await import("../../leaflet/evmWorld.js");
  if (EvmTorus.wrapLngSize === undefined || EvmTorus.wrapLatSize === undefined) {
    return originalPolygon;
  } else {
    const multiPolygons = [originalPolygon];
    // duplicate the tile over the 8 surrounding worlds
    for(let x = -1; x <= 1; x++) {
      for(let y = -1; y <= 1; y++) {
        if(x != 0 || y != 0) { // no need for a 0,0 translate
          multiPolygons.push(`ST_Translate(${originalPolygon},${EvmTorus.wrapLngSize * x}, ${EvmTorus.wrapLatSize * y})`)
        }
      }
    }
    return `ST_Union(ARRAY[${multiPolygons.join(',')}])`;
  }
}
