import { Sequelize } from 'sequelize';

export default async(): Promise<Sequelize> => {
  const db = new Sequelize({
    username: process.env.DB_USER,
    password: process.env.DB_PWD,
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    database: process.env.DB_NAME,
  });
  await db.authenticate();
  await db.query("SET bytea_output = 'hex'");
  return db;
};