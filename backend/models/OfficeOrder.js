import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OfficeOrder = sequelize.define("OfficeOrder", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  orderNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consignor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consignee: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  truckNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  driverNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  center: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lrCharge: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "PENDING",
  },
});

export default OfficeOrder;
