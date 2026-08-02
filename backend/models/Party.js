import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Party = sequelize.define("Party", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  partyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address1: DataTypes.STRING,
  address2: DataTypes.STRING,
  address3: DataTypes.STRING,
  city: DataTypes.STRING,
  district: DataTypes.STRING,
  state: DataTypes.STRING,
  stateCode: DataTypes.STRING,
  gstNo: DataTypes.STRING,
  panNo: DataTypes.STRING,
  contactName: DataTypes.STRING,
  mobileNos: DataTypes.STRING,
  selectType: {
    type: DataTypes.ENUM("CONSIGNEE", "CONSIGNOR", "BOTH"),
    defaultValue: "CONSIGNEE",
  },
  paymentDays: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
});

export default Party;
