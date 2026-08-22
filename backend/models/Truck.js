import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Truck = sequelize.define("Truck", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  truckNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ownerName: DataTypes.STRING,
  mobileNo: DataTypes.STRING,
  driverMobile: DataTypes.STRING,
  address: DataTypes.STRING,
  bankName: DataTypes.STRING,
  accountName: DataTypes.STRING,
  accountNo: DataTypes.STRING,
  ifscCode: DataTypes.STRING,
  branch: DataTypes.STRING,
  loadingDetail: DataTypes.STRING,
});

export default Truck;
