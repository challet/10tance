import pg from "pg";
import { type Model, ModelCtor, type Options, Sequelize } from 'sequelize';
import { EVMObject } from "./models/";

const CONFIG_BASE: Options = {
  port: 5432,
  dialectModule: pg,
  dialect: 'postgres',
  dialectOptions: {
    idle_in_transaction_session_timeout: 1000
  },
  pool: {
    max: 2,
    min: 0,
    idle: 0,
    acquire: 14000,
    evict: 1000
  }
};

let db: Promise<Sequelize> | null = null;

export default async(): Promise<Sequelize> => {

  if (db === null) {

    db = new Promise(async(resolve, reject) => {
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
      // TODO is bytea_output set still needed ?
      await db.query("SET bytea_output = 'hex'");
      // initialize the models which will be availaible through db.models
      [EVMObject].forEach(modelFactory => modelFactory(db));
      resolve(db);
    });
  }
  return db;
};

