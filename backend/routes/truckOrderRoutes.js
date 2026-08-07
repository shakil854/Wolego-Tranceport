import express from "express";
import TruckOrder from "../models/TruckOrder.js";

const router = express.Router();

// Helper to generate sequential Truck Order Number
async function generateTruckOrderNo() {
  try {
    const lastOrder = await TruckOrder.findOne({
      order: [["createdAt", "DESC"]],
    });

    if (lastOrder && lastOrder.orderNo) {
      const match = lastOrder.orderNo.match(/TO-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `TO-${nextNum}`;
      }
    }
  } catch (e) {
    console.error("Error calculating truck order number:", e);
  }
  return `TO-${Date.now().toString().slice(-4)}`;
}

// GET all Truck Orders
router.get("/", async (req, res) => {
  try {
    const orders = await TruckOrder.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching truck orders:", error);
    res.status(500).json({ error: "Failed to fetch truck orders." });
  }
});

// POST Create new Truck Order
router.post("/", async (req, res) => {
  try {
    const {
      createdBy,
      truckNo,
      truckMT,
      driverNo,
      location,
      center,
    } = req.body;

    const orderNo = await generateTruckOrderNo();
    const id = `TO-${Date.now()}`;

    const newOrder = await TruckOrder.create({
      id,
      orderNo,
      createdBy: createdBy || "TRUCK",
      truckNo: truckNo || "",
      truckMT: truckMT || "",
      driverNo: driverNo || "",
      location: location || "",
      center: center || "",
      status: "PENDING",
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating truck order:", error);
    res.status(500).json({ error: "Failed to create truck order." });
  }
});

// PUT Confirm Truck Order
router.put("/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmedBy } = req.body;

    const order = await TruckOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "Truck order not found." });
    }

    order.status = "CONFIRMED";
    order.confirmedAt = new Date();
    order.confirmedBy = confirmedBy || "OWNER";
    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Error confirming truck order:", error);
    res.status(500).json({ error: "Failed to confirm truck order." });
  }
});

// PUT Update Status (PENDING, CONFIRMED, CANCELLED)
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, confirmedBy } = req.body;

    const order = await TruckOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "Truck order not found." });
    }

    order.status = status;
    if (status === "CONFIRMED") {
      order.confirmedAt = new Date();
      order.confirmedBy = confirmedBy || "OWNER";
    }
    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Error updating truck order status:", error);
    res.status(500).json({ error: "Failed to update truck order status." });
  }
});

// DELETE Truck Order
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await TruckOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "Truck order not found." });
    }
    await order.destroy();
    res.json({ message: "Truck order deleted successfully." });
  } catch (error) {
    console.error("Error deleting truck order:", error);
    res.status(500).json({ error: "Failed to delete truck order." });
  }
});

export default router;
