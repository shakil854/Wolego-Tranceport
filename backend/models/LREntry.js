import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const LREntry = sequelize.define("LREntry", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  lrNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  copyData: DataTypes.STRING,
  fromPlace: DataTypes.STRING,
  toPlace: DataTypes.STRING,
  deliveryAt: DataTypes.STRING,
  truckNo: DataTypes.STRING,
  dateTime: DataTypes.STRING,

  // Consignor
  consignorName: DataTypes.STRING,
  consignorAddress: DataTypes.TEXT,
  consignorGst: DataTypes.STRING,

  // Consignee
  consigneeName: DataTypes.STRING,
  consigneeAddress: DataTypes.TEXT,
  consigneeGst: DataTypes.STRING,

  // Goods
  noOfArticles: DataTypes.STRING,
  bundles: DataTypes.STRING,
  descriptionOfGoods: DataTypes.STRING,
  noOfArticles2: DataTypes.STRING,
  bundles2: DataTypes.STRING,
  descriptionOfGoods2: DataTypes.STRING,
  weightKgs: DataTypes.STRING,
  ratePerTon: DataTypes.STRING,
  rateType: DataTypes.STRING,
  toPayOrPaid: DataTypes.STRING,
  freightAmount: DataTypes.FLOAT,

  // GST & Totals
  gstPayableBy: {
    type: DataTypes.ENUM("CONSIGNEE", "CONSIGNOR", "TRANSPORTER"),
    defaultValue: "CONSIGNEE",
  },
  sgstPercent: DataTypes.FLOAT,
  sgstAmount: DataTypes.FLOAT,
  cgstPercent: DataTypes.FLOAT,
  cgstAmount: DataTypes.FLOAT,
  igstPercent: DataTypes.FLOAT,
  igstAmount: DataTypes.FLOAT,
  totalWithGst: DataTypes.FLOAT,
  otherCharges: DataTypes.FLOAT,
  lessAdvancePaid: DataTypes.FLOAT,
  chequeYn: DataTypes.STRING,
  netTotalAmount: DataTypes.FLOAT,

  // Meta
  billNumbers: DataTypes.STRING,
  invoiceValue: DataTypes.STRING,
  driverName: DataTypes.STRING,
  licenseNumber: DataTypes.STRING,
  driverMobile: DataTypes.STRING,
  consignorEwayBill: DataTypes.STRING,
  consigneeEwayBill: DataTypes.STRING,
  remarks: DataTypes.TEXT,
  debitAmountTo: DataTypes.STRING,
  tripDays: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  truckComingDismissed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  // Accounting & Payment Tracking
  partyPaymentStatus: {
    type: DataTypes.ENUM("UNPAID", "PAID"),
    defaultValue: "UNPAID",
  },
  partyPaidAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  partyPaidDate: DataTypes.STRING,
  partyChequeNo: DataTypes.STRING,

  truckPaymentStatus: {
    type: DataTypes.ENUM("UNPAID", "PAID"),
    defaultValue: "UNPAID",
  },
  truckPaidAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  truckPaidDate: DataTypes.STRING,
  truckChequeNo: DataTypes.STRING,
});

export default LREntry;
