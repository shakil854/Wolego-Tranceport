import express from "express";
import User from "../models/User.js";
import Party from "../models/Party.js";

const router = express.Router();

// Helper to seed owner user if missing
const ensureOwnerUser = async () => {
  try {
    const ownerExists = await User.findOne({ where: { role: "OWNER" } });
    if (!ownerExists) {
      await User.create({
        id: "USER-OWNER-1",
        username: "owner",
        password: "12345",
        role: "OWNER",
        partyName: "Wolego Transport Owner",
      });
      // Also add fallback phone number for owner login
      await User.create({
        id: "USER-OWNER-2",
        username: "9979111555",
        password: "12345",
        role: "OWNER",
        partyName: "Wolego Transport Owner",
      });
      console.log("Default Owner user seeded successfully.");
    }
  } catch (err) {
    console.error("Error seeding owner user:", err.message);
  }
};

ensureOwnerUser();

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and Password are required." });
    }

    const cleanUsername = String(username).trim();

    // Check user table first
    let user = await User.findOne({ where: { username: cleanUsername } });

    // Fallback: If user is not found, check Party table by mobileNos
    if (!user) {
      const parties = await Party.findAll();
      const matchedParty = parties.find((p) => {
        if (!p.mobileNos) return false;
        const nums = p.mobileNos.split(/[,/ ]+/);
        return nums.some((num) => num.trim() === cleanUsername);
      });

      if (matchedParty) {
        // Auto-create user for this party
        user = await User.create({
          id: "USER-PARTY-" + matchedParty.id,
          username: cleanUsername,
          password: "12345",
          role: "PARTY",
          partyId: matchedParty.id,
          partyName: matchedParty.partyName,
          mobileNo: cleanUsername,
        });
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid Mobile Number or Username." });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Incorrect Password. Default password is 12345." });
    }

    // Success response
    const userPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      partyId: user.partyId,
      partyName: user.partyName,
    };

    return res.json({
      success: true,
      message: "Login successful!",
      user: userPayload,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Sync existing parties into user accounts
router.post("/sync-parties", async (req, res) => {
  try {
    const parties = await Party.findAll();
    let createdCount = 0;

    for (const party of parties) {
      if (party.mobileNos) {
        const nums = party.mobileNos.split(/[,/ ]+/).map((n) => n.trim()).filter(Boolean);
        for (const num of nums) {
          const existing = await User.findOne({ where: { username: num } });
          if (!existing) {
            await User.create({
              id: "USER-PARTY-" + party.id + "-" + num.slice(-4),
              username: num,
              password: "12345",
              role: "PARTY",
              partyId: party.id,
              partyName: party.partyName,
              mobileNo: num,
            });
            createdCount++;
          }
        }
      }
    }

    res.json({ success: true, message: `Synced ${createdCount} party accounts.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
