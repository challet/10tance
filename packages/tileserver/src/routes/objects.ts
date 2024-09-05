import { Request, Response } from "express";
import { Op } from "sequelize";
import initDb from '../common/sequelize';
import { EVMObject } from "../common/sequelize/models/EVMObject";
import File from "../services/files";

const objectsRoute = async (req: Request, res: Response) => {
  const { x, y, z } = res.locals.tile.coords;
  const file = await File.init(`objects/${z}`, `${x}-${y}.json`);

  if (!file.exists) {
    const db = await initDb();
    const EVMObject = db.models.EVMObject;

    // handle the bounds parameter
    const tileGeom = res.locals.tile.geom; 

    const data = await EVMObject.findAll({
      attributes: [
        // TODO inpect why the binary data cannot be raw fetched
        // without the convert_from, it looks like something (postgre, sequelize ?) is converting it to integer representation
        [db.fn('convert_from', db.col('id'), 'utf8'), 'id'],
        [db.literal('latlng::POINT'), 'latlng'],
        'meta'
      ],
      where: {
        [Op.and]: [
          db.literal("ST_CoveredBy(latlng, ST_GeomFromText($tileGeom))")
        ],
      },
      order: [
        [db.literal("COALESCE((meta#>>'{circulating_market_cap}')::decimal(15,0), 0)"), 'DESC'],
        [db.literal("COALESCE((meta#>>'{holders}')::decimal(15,0), 0)"), 'DESC']
      ],
      limit: 30,
      bind: { tileGeom }
    }) as EVMObject[];

    const result = data.map((d) => ({
      id: d.id,
      lat: d.latlng.y,
      lng: d.latlng.x,
      symbol: d.meta.symbol,
      name: d.meta.name,
      icon_url: d.meta.icon_url
    }));

    await file.save(Buffer.from(JSON.stringify(result), 'utf-8'));
  }
  file.sendToResponse(res.type("application/json"));
};

export default objectsRoute;
