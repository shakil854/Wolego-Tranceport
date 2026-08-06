import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "12345",
  },
  role: {
    type: DataTypes.ENUM("OWNER", "PARTY", "TRUCK"),
    allowNull: false,
    defaultValue: "PARTY",
  },
  partyId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  partyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mobileNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  actionPassword: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
});

export default User;
