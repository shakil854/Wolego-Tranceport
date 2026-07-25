import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Party from "../models/Party.js";

const router = express.Router();

// Helper to verify password (supports bcrypt hash and fallback plain text)
async function verifyAndUpgradePassword(user, password) {
  const isBcrypt = user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$");
  if (isBcrypt) {
    return await bcrypt.compare(password, user.password);
  }
  
  // Legacy plain text check
  const isMatch = user.password === password;
  if (isMatch) {
    // Transparently upgrade to bcrypt hash
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
    } catch (e) {
      console.error("Failed to upgrade legacy password hash:", e);
    }
  }
  return isMatch;
}

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

    // Fallback: If user is not found in User table, check if it matches a Party's mobileNos with CONSIGNEE or BOTH status
    if (!user) {
      const parties = await Party.findAll();
      const matchedParty = parties.find((p) => {
        if (!p.mobileNos) return false;
        const isConsigneeOrBoth = p.selectType === "CONSIGNEE" || p.selectType === "BOTH";
        if (!isConsigneeOrBoth) return false;
        const nums = p.mobileNos.split(/[,/ ]+/);
        return nums.some((num) => num.trim() === cleanUsername);
      });

      if (matchedParty) {
        // Create user record for this party with hashed default password
        const hashedPassword = await bcrypt.hash("12345", 10);
        user = await User.create({
          id: "USER-PARTY-" + matchedParty.id,
          username: cleanUsername,
          password: hashedPassword,
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

    const isMatch = await verifyAndUpgradePassword(user, password);
    if (!isMatch) {
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

// Change password endpoint
router.post("/change-password", async (req, res) => {
  try {
    const { id, username, currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: "New password must be at least 4 characters long." });
    }

    let user = null;
    if (id) {
      user = await User.findByPk(id);
    }
    if (!user && username) {
      user = await User.findOne({ where: { username: String(username).trim() } });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Verify current password
    const isMatch = await verifyAndUpgradePassword(user, currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password." });
    }

    // Hash new password and save
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
