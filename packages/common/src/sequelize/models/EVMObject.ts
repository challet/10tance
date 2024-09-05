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
      {id: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'},
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

    console.log({ tileGeom, minStrength });
    return EVMObject.findAll({
      attributes: this.COMMON_ATTRIBUTES,
      where: {
        [Op.and]: [
          ...this.COMMON_INFLUENCERS_WHERE,
          // outside the tile
          db.literal("NOT ST_CoveredBy(latlng, ST_GeomFromText($tileGeom))"),
          // and with influence able to reach it
          //db.literal("LOG((meta->>'circulating_market_cap')::FLOAT) / ST_Distance(latlng, ST_Union(ARRAY[ST_GeomFromText($tileGeom),ST_Translate(ST_GeomFromText($tileGeom), 1125899906842624, 0),ST_Translate(ST_GeomFromText($tileGeom), -1125899906842624, 0),ST_Translate(ST_GeomFromText($tileGeom), 0, 1125899906842624),ST_Translate(ST_GeomFromText($tileGeom), 0, -1125899906842624)])) > $minStrength")
        ],
      },
      order: [
        [db.literal("LOG((meta->>'circulating_market_cap')::FLOAT) / ST_Distance(latlng, ST_Union(ARRAY[ST_GeomFromText($tileGeom),ST_Translate(ST_GeomFromText($tileGeom), 1125899906842624, 0),ST_Translate(ST_GeomFromText($tileGeom), -1125899906842624, 0),ST_Translate(ST_GeomFromText($tileGeom), 0, 1125899906842624),ST_Translate(ST_GeomFromText($tileGeom), 0, -1125899906842624)]))"), "DESC"]
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

