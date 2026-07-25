import express from "express";
import Party from "../models/Party.js";
import User from "../models/User.js";

const router = express.Router();

// Get all parties
router.get("/", async (req, res) => {
  try {
    const parties = await Party.findAll({ order: [["createdAt", "DESC"]] });
    res.json(parties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save or Update party
router.post("/", async (req, res) => {
  try {
    const partyData = req.body;
    if (!partyData.id) {
      partyData.id = "PARTY-" + Date.now().toString().slice(-4);
    }
    const [party, created] = await Party.upsert(partyData);

    // Auto register party user account(s) using mobile numbers
    if (partyData.mobileNos) {
      const nums = String(partyData.mobileNos)
        .split(/[,/ ]+/)
        .map((n) => n.trim())
        .filter(Boolean);

      for (const num of nums) {
        await User.upsert({
          id: "USER-PARTY-" + (party.id || partyData.id) + "-" + num.slice(-4),
          username: num,
          password: "12345",
          role: "PARTY",
          partyId: party.id || partyData.id,
          partyName: party.partyName || partyData.partyName,
          mobileNo: num,
        });
      }
    }

    res.json({ success: true, party });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete party
router.delete("/:id", async (req, res) => {
  try {
    await Party.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
