import pg from "pg";
import { type Options, Sequelize } from 'sequelize';


const CONFIG_BASE: Options = {
  port: 5432,
  dialectModule: pg,
  dialect: 'postgres',
  dialectOptions: {
    idle_in_transaction_session_timeout: 5000
  },
  pool: {
    max: 2,
    min: 0,
    idle: 0,
    acquire: 5000,
    evict: 1000
  }
};

export default async(): Promise<Sequelize> => {
  const db = "POSTGRES_URL" in process.env 
    ? new Sequelize(process.env.POSTGRES_URL as string, CONFIG_BASE)
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