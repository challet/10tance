import { Request, Response } from "express";
import initDb from '../common/sequelize';
import { Op, type FindAttributeOptions, type ModelCtor  } from "sequelize";
import { getColor } from "colorthief";
import { getFile, saveFile, sendFile, USE_BLOB_STORAGE, type fileType } from "../services/files";
import { EVMObject as EVMObjectType } from "../common/sequelize/models/EVMObject";
import createImage, { type pixelInfluencer } from "../services/image";



const routeFactory = async () => {
  
  
  return async (req: Request, res: Response) => {
    const { x, y, z } = res.locals.tile.coords;
    const fileDir = USE_BLOB_STORAGE ? `tiles/${z}` : `${process.cwd()}/files/${z}`;
    const filePath = `${fileDir}/${x}-${y}.png`;

    let file: fileType | null = await getFile(filePath, fileDir);

    if (file === null) {
      const db = await initDb();
      const EVMObject = db.models.EVMObject;

      const MIN_STRENGTH = 1 / Math.pow(2, 46);

      const attributes = [
        // TODO inpect why the binary data cannot be raw fetched
        // without the convert_from, it looks like something (postgre, sequelize ?) is converting it to integer representation
        [db.fn('convert_from', db.col('id'), 'utf8'), 'id'],
        [db.literal('latlng::POINT'), 'latlng'],
        'meta'
      ] as FindAttributeOptions;
      const where = [
        db.literal("meta->'circulating_market_cap' IS NOT NULL"),
        db.literal("(meta->>'circulating_market_cap')::float != 0"),
        db.literal("meta->'icon_url' IS NOT NULL")
      ];

      const innerTileQuery = EVMObject.findAll({
        attributes,
        where: {
          [Op.and]: [
            ...where,
            // inside the tile
            db.literal("ST_CoveredBy(latlng, ST_GeomFromText($tileGeom))")
          ],
        },
        order: [
          [db.literal("(meta->>'circulating_market_cap')::float"), "DESC"]
        ],
        bind: { tileGeom: res.locals.tile.geom },
        limit: 30
      });

      const outerTileQuery = await EVMObject.findAll({
        attributes,
        where: {
          [Op.and]: [
            ...where,
            // outside the tile
            db.literal("NOT ST_CoveredBy(latlng, ST_GeomFromText($tileGeom))"),
            // and with influence able to reach it
            db.literal("LOG((meta->>'circulating_market_cap')::float) / ST_Distance(latlng, ST_GeomFromText($tileGeom)) > $MIN_STRENGTH")
          ],
        },
        order: [
          [db.literal("LOG((meta->>'circulating_market_cap')::float) / ST_Distance(latlng, ST_GeomFromText($tileGeom))"), "DESC"]
        ],
        bind: { tileGeom: res.locals.tile.geom, MIN_STRENGTH },
        limit: 150
      });

      const [innerTileData, outerTileData] = await Promise.all([innerTileQuery, outerTileQuery]);
      const data = innerTileData.concat(outerTileData) as EVMObjectType[];
      
      // prepare the data
      const influencers = await Promise.all(data.map(async (d): Promise<pixelInfluencer> => {
        let color;
        // TODO color pickcing could be done once and stored in the db
        try {
          color = await getColor(d.meta.icon_url!);
        } catch(e) {
          // can happen for "webp" images not supported by node-pixels
          color = null;
        }
        return {
          color: color != null ? { r: color[0], g: color[1], b: color[2] } : { r: 255, g: 255, b: 255 },
          latlng: {lat: d.latlng.y, lng: d.latlng.y},
          rawStrength: d.meta.circulating_market_cap!
        };
      }));

      //create the image
      const image = await createImage(res.locals.tile.coords, influencers, MIN_STRENGTH);
      
      // save it 
      file = await saveFile(await image.getBuffer("image/png"), filePath, fileDir);
    }
    // send it
    sendFile(file, res);
  }

}

export default routeFactory;
