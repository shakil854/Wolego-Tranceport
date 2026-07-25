import express from "express";
import LREntry from "../models/LREntry.js";

const router = express.Router();

// Get all LRs
router.get("/", async (req, res) => {
  try {
    const lrs = await LREntry.findAll({ order: [["createdAt", "DESC"]] });
    res.json(lrs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save or Update LR
router.post("/", async (req, res) => {
  try {
    const lrData = req.body;
    if (!lrData.id) {
      lrData.id = "LR-" + (lrData.lrNumber || Date.now().toString().slice(-4));
    }
    const [lr, created] = await LREntry.upsert(lrData);
    res.json({ success: true, lr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete LR
router.delete("/:id", async (req, res) => {
  try {
    await LREntry.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Payment Status (Party or Truck)
router.put("/:id/payment-status", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      partyPaymentStatus,
      partyPaidAmount,
      partyPaidDate,
      truckPaymentStatus,
      truckPaidAmount,
      truckPaidDate,
    } = req.body;

    const lr = await LREntry.findByPk(id);
    if (!lr) {
      return res.status(404).json({ error: "LR Entry not found." });
    }

    if (partyPaymentStatus !== undefined) lr.partyPaymentStatus = partyPaymentStatus;
    if (partyPaidAmount !== undefined) lr.partyPaidAmount = partyPaidAmount;
    if (partyPaidDate !== undefined) lr.partyPaidDate = partyPaidDate;
    if (truckPaymentStatus !== undefined) lr.truckPaymentStatus = truckPaymentStatus;
    if (truckPaidAmount !== undefined) lr.truckPaidAmount = truckPaidAmount;
    if (truckPaidDate !== undefined) lr.truckPaidDate = truckPaidDate;

    await lr.save();
    res.json({ success: true, lr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
