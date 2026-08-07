import express from "express";
import PartyOrder from "../models/PartyOrder.js";

const router = express.Router();

// Helper to generate sequential Order Number
async function generatePartyOrderNo() {
  try {
    const lastOrder = await PartyOrder.findOne({
      order: [["createdAt", "DESC"]],
    });

    if (lastOrder && lastOrder.orderNo) {
      const match = lastOrder.orderNo.match(/PO-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `PO-${nextNum}`;
      }
    }
  } catch (e) {
    console.error("Error calculating party order number:", e);
  }
  return `PO-${Date.now().toString().slice(-4)}`;
}

// GET all Party Orders
router.get("/", async (req, res) => {
  try {
    const orders = await PartyOrder.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching party orders:", error);
    res.status(500).json({ error: "Failed to fetch party orders." });
  }
});

// POST Create new Party Order
router.post("/", async (req, res) => {
  try {
    const {
      createdBy,
      partyName,
      consignor1Name,
      consignor1Mo,
      consignor2Name,
      consignor2Mo,
      consignor3Name,
      consignor3Mo,
      consignor4Name,
      consignor4Mo,
      consigneeBillingName,
      unloadingPoint,
      truckMT,
      remark,
    } = req.body;

    const orderNo = await generatePartyOrderNo();
    const id = `PO-${Date.now()}`;

    const newOrder = await PartyOrder.create({
      id,
      orderNo,
      createdBy: createdBy || "PARTY",
      partyName: partyName || "",
      consignor1Name: consignor1Name || "",
      consignor1Mo: consignor1Mo || "",
      consignor2Name: consignor2Name || "",
      consignor2Mo: consignor2Mo || "",
      consignor3Name: consignor3Name || "",
      consignor3Mo: consignor3Mo || "",
      consignor4Name: consignor4Name || "",
      consignor4Mo: consignor4Mo || "",
      consigneeBillingName: consigneeBillingName || "",
      unloadingPoint: unloadingPoint || "",
      truckMT: truckMT || "",
      remark: remark || "",
      status: "PENDING",
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating party order:", error);
    res.status(500).json({ error: "Failed to create party order." });
  }
});

// PUT Confirm Party Order
router.put("/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmedBy } = req.body;

    const order = await PartyOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "Party order not found." });
    }

    order.status = "CONFIRMED";
    order.confirmedAt = new Date();
    order.confirmedBy = confirmedBy || "OWNER";
    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Error confirming party order:", error);
    res.status(500).json({ error: "Failed to confirm party order." });
  }
});

// PUT Update Status (PENDING, CONFIRMED, CANCELLED)
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, confirmedBy } = req.body;

    const order = await PartyOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "Party order not found." });
    }

    order.status = status;
    if (status === "CONFIRMED") {
      order.confirmedAt = new Date();
      order.confirmedBy = confirmedBy || "OWNER";
    }
    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Error updating party order status:", error);
    res.status(500).json({ error: "Failed to update party order status." });
  }
});

// DELETE Party Order
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await PartyOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "Party order not found." });
    }
    await order.destroy();
    res.json({ message: "Party order deleted successfully." });
  } catch (error) {
    console.error("Error deleting party order:", error);
    res.status(500).json({ error: "Failed to delete party order." });
  }
});

export default router;
