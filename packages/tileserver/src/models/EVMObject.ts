import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';

interface EVMObject extends Model<InferAttributes<EVMObject>, InferCreationAttributes<EVMObject>> {
  id: string;
  latlng: {
    x: number;
    y: number;
  }
}

export default (db: Sequelize) => {
  return db.define<EVMObject>(
    'EVMObject', {
      id: {
        type: DataTypes.BLOB,
        primaryKey: true
      },
      latlng: Sequelize.GEOMETRY('POINT'),
      type: DataTypes.ENUM('ZERO', 'ERC20')
    }, {
      tableName: 'evm_addresses',
      timestamps: false
    }
  );
}
