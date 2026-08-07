import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TruckOrder = sequelize.define("TruckOrder", {
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
  // Fields specified in Truck Portal note
  truckNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  truckMT: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  driverNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  center: {
    type: DataTypes.STRING,
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

export default TruckOrder;
