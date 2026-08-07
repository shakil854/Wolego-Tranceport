import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PartyOrder = sequelize.define("PartyOrder", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  orderNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  partyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Consignor fields (up to 4)
  consignor1Name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consignor1Mo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consignor2Name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consignor2Mo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consignor3Name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consignor3Mo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consignor4Name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consignor4Mo: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // Consignee Billing Name
  consigneeBillingName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Unloading Point
  unloadingPoint: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Truck M.T.
  truckMT: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Remark
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Status: PENDING / CONFIRMED / CANCELLED
  status: {
    type: DataTypes.ENUM("PENDING", "CONFIRMED", "CANCELLED"),
    defaultValue: "PENDING",
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  confirmedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default PartyOrder;
