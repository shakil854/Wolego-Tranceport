import express from "express";
import TruckPayment from "../models/TruckPayment.js";

const router = express.Router();

// Get all truck payments sorted by date/createdAt DESC
router.get("/", async (req, res) => {
  try {
    const records = await TruckPayment.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new truck payment record
router.post("/", async (req, res) => {
  try {
    const { truckNo, amount, remark, date, status } = req.body;
    
    if (!truckNo || amount === undefined) {
      return res.status(400).json({ error: "Truck No and Amount are required" });
    }

    const todayDate = new Date().toISOString().split("T")[0];

    const newRecord = await TruckPayment.create({
      id: "TP-" + Date.now().toString().slice(-8),
      truckNo: truckNo.toUpperCase().trim(),
      amount: Number(amount) || 0,
      remark: remark ? remark.trim() : "",
      date: date || todayDate,
      status: status || "PENDING",
    });

    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update truck payment (e.g. mark status as PAID or edit fields)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const record = await TruckPayment.findByPk(id);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    const { status, truckNo, amount, remark, date } = req.body;

    if (status !== undefined) record.status = status;
    if (truckNo !== undefined) record.truckNo = truckNo.toUpperCase().trim();
    if (amount !== undefined) record.amount = Number(amount) || 0;
    if (remark !== undefined) record.remark = remark.trim();
    if (date !== undefined) record.date = date;

    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete truck payment record
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await TruckPayment.destroy({ where: { id } });

    if (deletedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
