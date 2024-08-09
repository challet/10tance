import { Sequelize, DataTypes, Model } from 'sequelize';

export default (db: Sequelize) => {
  return db.define(
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
