import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TruckPayment = sequelize.define("TruckPayment", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  truckNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "PENDING",
  },
});

export default TruckPayment;
