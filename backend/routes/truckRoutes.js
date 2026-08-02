import express from "express";
import bcrypt from "bcrypt";
import Truck from "../models/Truck.js";
import User from "../models/User.js";

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

    // Auto register truck user account(s) if mobileNo is provided
    if (truckData.mobileNo) {
      const nums = String(truckData.mobileNo)
        .split(/[,/ ]+/)
        .map((n) => n.trim())
        .filter(Boolean);

      for (const num of nums) {
        const existingUser = await User.findOne({ where: { username: num } });
        if (!existingUser) {
          const hashedPassword = await bcrypt.hash("12345", 10);
          await User.create({
            id: "USER-TRUCK-" + (truck.id || truckData.id) + "-" + num.slice(-4),
            username: num,
            password: hashedPassword,
            role: "TRUCK",
            mobileNo: num,
          });
        }
      }
    }

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
