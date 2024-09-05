import { Model, DataTypes } from 'sequelize';
import type { Sequelize, InferAttributes, InferCreationAttributes } from 'sequelize';

class EVMObject extends Model<InferAttributes<EVMObject>, InferCreationAttributes<EVMObject>> {
  declare id: Buffer;
  declare latlng: {
    x: number;
    y: number;
  }
  declare type: string;
  declare meta: {
    symbol?: string;
    name?: string;
    icon_url?: string;
    circulating_market_cap?: number;
    holders: number;
  }
}

export type EVMObjectType = InstanceType<typeof EVMObject>;

export default (db: Sequelize) => {
  return EVMObject.init({
    id: {
      type: DataTypes.BLOB,
      primaryKey: true
    },
    latlng: DataTypes.GEOMETRY('POINT'),
    type: DataTypes.ENUM('ZERO', 'ERC20'),
    meta: DataTypes.JSONB
  }, {
    sequelize: db,
    tableName: 'evm_addresses',
    modelName: 'EVMObject',
    timestamps: false
  });
};
