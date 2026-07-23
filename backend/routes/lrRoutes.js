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

export default router;
