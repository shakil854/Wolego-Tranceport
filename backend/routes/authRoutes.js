import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Party from "../models/Party.js";
import Truck from "../models/Truck.js";

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

// Helper to verify separate action/security password for protected actions (LR Edit, Delete, Truck Debit)
async function verifyAndUpgradeActionPassword(user, password) {
  if (!user || !user.actionPassword) {
    // If no separate action password is set yet, verify against login password as fallback
    return await verifyAndUpgradePassword(user, password);
  }

  const isBcrypt = user.actionPassword.startsWith("$2a$") || user.actionPassword.startsWith("$2b$") || user.actionPassword.startsWith("$2y$");
  if (isBcrypt) {
    return await bcrypt.compare(password, user.actionPassword);
  }

  const isMatch = user.actionPassword === password;
  if (isMatch) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.actionPassword = hashedPassword;
      await user.save();
    } catch (e) {
      console.error("Failed to upgrade action password hash:", e);
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

    // Fallback: If user is not found in User table, check if it matches any Party's mobileNos (CONSIGNOR, CONSIGNEE, or BOTH)
    if (!user) {
      const parties = await Party.findAll();
      const matchedParty = parties.find((p) => {
        if (!p.mobileNos) return false;
        const nums = String(p.mobileNos).split(/[,/ ]+/);
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

    // Fallback: If user is not found in User table, check if it matches a Truck's mobileNo
    if (!user) {
      const trucks = await Truck.findAll();
      const matchedTruck = trucks.find((t) => {
        if (!t.mobileNo) return false;
        const nums = String(t.mobileNo).split(/[,/ ]+/);
        return nums.some((num) => num.trim() === cleanUsername);
      });

      if (matchedTruck) {
        const hashedPassword = await bcrypt.hash("12345", 10);
        user = await User.create({
          id: "USER-TRUCK-" + cleanUsername,
          username: cleanUsername,
          password: hashedPassword,
          role: "TRUCK",
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

// Change Action/Security Password endpoint (for LR Edit, Delete, Truck Debit)
router.post("/change-action-password", async (req, res) => {
  try {
    const { id, username, currentPassword, newActionPassword } = req.body;

    if (!newActionPassword) {
      return res.status(400).json({ error: "New Action Security Password is required." });
    }

    if (newActionPassword.length < 4) {
      return res.status(400).json({ error: "Action Security Password must be at least 4 characters long." });
    }

    let user = null;
    if (id) {
      user = await User.findByPk(id);
    }
    if (!user && username) {
      user = await User.findOne({ where: { username: String(username).trim() } });
    }
    if (!user) {
      user = await User.findOne({ where: { role: "OWNER" } });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Verify current password (either current action password or login password)
    let isMatch = await verifyAndUpgradeActionPassword(user, currentPassword);
    if (!isMatch && currentPassword) {
      isMatch = await verifyAndUpgradePassword(user, currentPassword);
    }

    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password." });
    }

    // Hash and save new action password
    const hashedPassword = await bcrypt.hash(newActionPassword, 10);
    user.actionPassword = hashedPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Action Security Password updated successfully!",
    });
  } catch (err) {
    console.error("Change action password error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify password endpoint for security-protected actions (Edit/Delete LR, Truck Debit)
router.post("/verify-password", async (req, res) => {
  try {
    const { password, id, username, passwordType } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: "Password is required." });
    }

    let user = null;
    if (id) {
      user = await User.findByPk(id);
    }
    if (!user && username) {
      user = await User.findOne({ where: { username: String(username).trim() } });
    }
    if (!user) {
      // Find OWNER user in database
      user = await User.findOne({ where: { role: "OWNER" } });
    }
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      return res.status(404).json({ success: false, error: "No user account found." });
    }

    let isMatch = false;
    if (passwordType === "login") {
      isMatch = await verifyAndUpgradePassword(user, password);
    } else {
      isMatch = await verifyAndUpgradeActionPassword(user, password);
    }

    if (!isMatch) {
      const errorMsg = passwordType === "login"
        ? "Incorrect Login Password! Access Denied."
        : "Incorrect Action Security Password! Access Denied.";
      return res.status(401).json({ success: false, error: errorMsg });
    }

    return res.json({
      success: true,
      message: "Password verified successfully!",
    });
  } catch (err) {
    console.error("Verify password error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
