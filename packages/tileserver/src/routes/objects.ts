import { Request, Response } from "express";
import { Op } from "sequelize";
import initDb from '../common/sequelize';
import { EVMObject } from "../common/sequelize/models/EVMObject";

const objectsRoute = async (req: Request, res: Response) => {
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

  res.json(data.map((d) => {
    return {
      id: d.id,
      lat: d.latlng.y,
      lng: d.latlng.x,
      symbol: d.meta.symbol,
      name: d.meta.name,
      icon_url: d.meta.icon_url
    };
  }));
};

export default objectsRoute;
