import express from "express";
import LREntry from "../models/LREntry.js";
import { generateLRPdf } from "../controllers/pdfController.js";

const router = express.Router();

// Generate PDF via Puppeteer (In-Memory A4 Binary Response)
router.post("/generate-pdf", generateLRPdf);


// Get all LRs (Sorted numerically by LR Number)
router.get("/", async (req, res) => {
  try {
    const lrs = await LREntry.findAll();
    lrs.sort((a, b) => {
      const numA = parseInt(a.lrNumber, 10);
      const numB = parseInt(b.lrNumber, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return String(a.lrNumber || "").localeCompare(String(b.lrNumber || ""), undefined, { numeric: true, sensitivity: "base" });
    });
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
      partyChequeNo,
      truckPaymentStatus,
      truckPaidAmount,
      truckPaidDate,
      truckChequeNo,
    } = req.body;

    const lr = await LREntry.findByPk(id);
    if (!lr) {
      return res.status(404).json({ error: "LR Entry not found." });
    }

    if (partyPaymentStatus !== undefined) lr.partyPaymentStatus = partyPaymentStatus;
    if (partyPaidAmount !== undefined) lr.partyPaidAmount = partyPaidAmount;
    if (partyPaidDate !== undefined) lr.partyPaidDate = partyPaidDate;
    if (partyChequeNo !== undefined) lr.partyChequeNo = partyChequeNo;
    if (truckPaymentStatus !== undefined) lr.truckPaymentStatus = truckPaymentStatus;
    if (truckPaidAmount !== undefined) lr.truckPaidAmount = truckPaidAmount;
    if (truckPaidDate !== undefined) lr.truckPaidDate = truckPaidDate;
    if (truckChequeNo !== undefined) lr.truckChequeNo = truckChequeNo;

    await lr.save();
    res.json({ success: true, lr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
