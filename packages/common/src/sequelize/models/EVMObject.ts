import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';

interface EVMObject extends Model<InferAttributes<EVMObject>, InferCreationAttributes<EVMObject>> {
  id: Buffer;
  latlng: {
    x: number;
    y: number;
  },
  type: string,
  meta: {
    symbol?: string,
    name?: string;
    icon_url?: string,
    circulating_market_cap?: number
    holders: number
  }
}

export type {EVMObject};

export default (db: Sequelize) => {
  console.log("initModel");
  return db.define<EVMObject>(
    'EVMObject', {
      id: {
        type: DataTypes.BLOB,
        primaryKey: true
      },
      latlng: DataTypes.GEOMETRY('POINT'),
      type: DataTypes.ENUM('ZERO', 'ERC20'),
      meta: DataTypes.JSONB
    }, {
      tableName: 'evm_addresses',
      timestamps: false
    }
  );
}
