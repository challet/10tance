import { Request, Response } from "express";
import initDb, { initModel } from '../../common/sequelize/index';

const routeFactory = async () => {
  console.log(initDb);
  const db = await initDb();

  const EVMObject = initModel(db);

  return async (req: Request, res: Response) => {
    const data = await EVMObject.findAll({
      order: [[db.literal("meta->'circulating_market_cap'"), 'DESC']],
      limit: 50
    });
    res.json(data.map((d:typeof EVMObject) => {
      return {
        id: d.id.toString('hex'),
        lat: d.latlng.y,
        lng: d.latlng.x
      };
    }));
  }

}

export default routeFactory;