import express from "express";
import Truck from "../models/Truck.js";

const router = express.Router();

// Get all trucks
router.get("/", async (req, res) => {
  try {
    const trucks = await Truck.findAll({ order: [["createdAt", "DESC"]] });
    res.json(trucks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save or Update truck
router.post("/", async (req, res) => {
  try {
    const truckData = req.body;
    if (!truckData.id) {
      truckData.id = "TRUCK-" + Date.now().toString().slice(-6);
    }
    const [truck, created] = await Truck.upsert(truckData);
    res.json({ success: true, truck: truckData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete truck
router.delete("/:id", async (req, res) => {
  try {
    await Truck.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
