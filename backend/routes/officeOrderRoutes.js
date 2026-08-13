import express from "express";
import OfficeOrder from "../models/OfficeOrder.js";

const router = express.Router();

// GET all office orders
router.get("/", async (req, res) => {
  try {
    const orders = await OfficeOrder.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching office orders:", error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE new office order
router.post("/", async (req, res) => {
  try {
    const { consignor, consignee, truckNo, driverNo, center, lrCharge, remark, createdBy } = req.body;

    // Generate unique order number (e.g. OO-0001)
    const count = await OfficeOrder.count();
    const nextNum = String(count + 1).padStart(4, "0");
    const orderNo = `OO-${nextNum}`;
    const id = `OFFICE-ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = await OfficeOrder.create({
      id,
      orderNo,
      consignor: consignor || "",
      consignee: consignee || "",
      truckNo: truckNo ? String(truckNo).toUpperCase().trim() : "",
      driverNo: driverNo || "",
      center: center || "",
      lrCharge: parseFloat(lrCharge) || 0,
      remark: remark || "",
      createdBy: createdBy || "SYSTEM",
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating office order:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE office order
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OfficeOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "Office Order not found." });
    }
    await order.destroy();
    res.json({ message: "Office order deleted successfully.", id });
  } catch (error) {
    console.error("Error deleting office order:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE/CONFIRM office order status
router.put("/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OfficeOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "Office Order not found." });
    }
    const newStatus = order.status === "CONFIRMED" ? "PENDING" : "CONFIRMED";
    order.status = newStatus;
    await order.save();
    res.json({ message: `Office Order ${newStatus.toLowerCase()} successfully.`, order });
  } catch (error) {
    console.error("Error confirming office order:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
