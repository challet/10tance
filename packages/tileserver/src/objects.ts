import { Request, Response } from "express";
import { Op } from "sequelize";
import { initDb, initModel } from '../../common/sequelize/index.ts';

const routeFactory = async () => {
  const db = await initDb();
  const EVMObject = initModel(db);

  return async (req: Request, res: Response) => {
    const whereClause = {};

    // handle the bounds parameter
    const boundsMatches = (typeof req.query.bounds === "string") 
      ? req.query.bounds.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*),(-?\d+\.?\d*),(-?\d+\.?\d*)$/)
      : null;
    let boundsPolygon = null;
    if( boundsMatches != null ) {
      const [glob, east, south, west, north] = boundsMatches;
      boundsPolygon = `POLYGON((${east} ${south}, ${east} ${north}, ${west} ${north}, ${west} ${south}, ${east} ${south}))`
    }

    const data = await EVMObject.findAll({
      attributes: [
        // TODO inpect why the binary data cannot be raw fetched
        // without the convert_from, it looks like something (postgre, sequelize ?) is converting it to integer representation
        [db.fn('convert_from', db.col('id'), 'utf8'), 'id'],
        'latlng',
        'meta'
      ],
      order: [
        [db.literal("COALESCE((meta#>>'{circulating_market_cap}')::decimal(15,0), 0)"), 'DESC'],
        [db.literal("COALESCE((meta#>>'{holders}')::decimal(15,0), 0)"), 'DESC']
      ],
      where: {
        [Op.and]: [
          db.literal(`ST_Within(latlng::geometry, ST_GeomFromText('${boundsPolygon}'))`)
        ],
      },
      limit: 30
    });
    res.json(data.map((d) => {
      return {
        id: d.id,
        lat: d.latlng.y,
        lng: d.latlng.x,
        name: d.meta.name,
        icon_url: d.meta.icon_url
      };
    }));
  }

}

export default routeFactory;