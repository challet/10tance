import pg from "pg";
import { type Options, Sequelize } from 'sequelize';


const CONFIG_BASE: Options = {
  port: 5432,
  dialectModule: pg,
  dialect: 'postgres'
};

export default async(): Promise<Sequelize> => {
  const db = "POSTGRES_URL_NON_POOLING" in process.env 
    ? new Sequelize(process.env.POSTGRES_URL_NON_POOLING as string, CONFIG_BASE)
    : new Sequelize({
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      ...CONFIG_BASE
    });
  await db.authenticate();
  await db.query("SET bytea_output = 'hex'");
  return db;
};