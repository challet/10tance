import { Sequelize } from 'sequelize';
import { Request, Response } from "express";


import initModel from './models/EVMObject';


const routeFactory = async () => {
  const db = new Sequelize({
    username: process.env.DB_USER,
    password: process.env.DB_PWD,
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    database: process.env.DB_NAME,
  });
  await db.authenticate();

  const EVMObject = initModel(db);

  return async (req: Request, res: Response) => {
    const data = await EVMObject.findAll();
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