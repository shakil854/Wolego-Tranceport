import express from "express";
import User from "../models/User.js";
import Party from "../models/Party.js";

const router = express.Router();

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Mobile Number / Username and Password are required." });
    }

    const cleanUsername = String(username).trim();

    // Check user table in database
    let user = await User.findOne({ where: { username: cleanUsername } });

    // Fallback: If user is not found in User table, check if it matches a Party's mobileNos
    if (!user) {
      const parties = await Party.findAll();
      const matchedParty = parties.find((p) => {
        if (!p.mobileNos) return false;
        const nums = p.mobileNos.split(/[,/ ]+/);
        return nums.some((num) => num.trim() === cleanUsername);
      });

      if (matchedParty) {
        // Create user record for this party
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
      return res.status(401).json({ error: "Incorrect Password." });
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

export default router;
