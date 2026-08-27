import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = express.Router();

// 1. GET all users (Sorted by role and username)
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "role", "partyId", "partyName", "mobileNo", "actionPassword", "createdAt", "updatedAt"],
    });

    const rolePriority = { OWNER: 1, OFFICE: 2, PARTY: 3, TRUCK: 4 };

    users.sort((a, b) => {
      const pA = rolePriority[a.role] || 99;
      const pB = rolePriority[b.role] || 99;
      if (pA !== pB) return pA - pB;
      return String(a.username || "").localeCompare(String(b.username || ""));
    });

    const safeUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      partyId: u.partyId,
      partyName: u.partyName,
      mobileNo: u.mobileNo,
      hasActionPassword: Boolean(u.actionPassword),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    res.json(safeUsers);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE new user
router.post("/", async (req, res) => {
  try {
    const { username, password, role, partyName, partyId, mobileNo, actionPassword } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username / Mobile number is required." });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: "Password is required." });
    }

    const cleanUsername = String(username).trim();

    // Check if username already exists
    const existing = await User.findOne({ where: { username: cleanUsername } });
    if (existing) {
      return res.status(400).json({ error: `Username / Mobile "${cleanUsername}" is already in use.` });
    }

    const hashedPassword = await bcrypt.hash(String(password).trim(), 10);
    let hashedActionPassword = null;
    if (actionPassword && String(actionPassword).trim()) {
      hashedActionPassword = await bcrypt.hash(String(actionPassword).trim(), 10);
    }

    const newUserId = "USER-" + Date.now();

    const createdUser = await User.create({
      id: newUserId,
      username: cleanUsername,
      password: hashedPassword,
      role: role || "OFFICE",
      partyName: partyName ? String(partyName).trim().toUpperCase() : null,
      partyId: partyId || null,
      mobileNo: mobileNo ? String(mobileNo).trim() : cleanUsername,
      actionPassword: hashedActionPassword,
    });

    res.json({
      success: true,
      message: "User created successfully!",
      user: {
        id: createdUser.id,
        username: createdUser.username,
        role: createdUser.role,
        partyId: createdUser.partyId,
        partyName: createdUser.partyName,
        mobileNo: createdUser.mobileNo,
        hasActionPassword: Boolean(createdUser.actionPassword),
        createdAt: createdUser.createdAt,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. UPDATE user details (role, username, partyName, mobileNo)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, partyName, partyId, mobileNo } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (username && String(username).trim() !== user.username) {
      const cleanUsername = String(username).trim();
      const existing = await User.findOne({ where: { username: cleanUsername } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: `Username "${cleanUsername}" is already taken by another account.` });
      }
      user.username = cleanUsername;
    }

    if (role) user.role = role;
    if (partyName !== undefined) user.partyName = partyName ? String(partyName).trim().toUpperCase() : null;
    if (partyId !== undefined) user.partyId = partyId || null;
    if (mobileNo !== undefined) user.mobileNo = mobileNo ? String(mobileNo).trim() : null;

    await user.save();

    res.json({
      success: true,
      message: "User details updated successfully!",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        partyId: user.partyId,
        partyName: user.partyName,
        mobileNo: user.mobileNo,
        hasActionPassword: Boolean(user.actionPassword),
      },
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. DIRECT PASSWORD RESET BY OWNER (No old password required!)
router.put("/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, newActionPassword } = req.body;

    if (!newPassword && !newActionPassword) {
      return res.status(400).json({ error: "New password is required." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (newPassword && String(newPassword).trim()) {
      const cleanPass = String(newPassword).trim();
      if (cleanPass.length < 3) {
        return res.status(400).json({ error: "Password must be at least 3 characters long." });
      }
      user.password = await bcrypt.hash(cleanPass, 10);
    }

    if (newActionPassword !== undefined) {
      if (newActionPassword && String(newActionPassword).trim()) {
        const cleanActionPass = String(newActionPassword).trim();
        user.actionPassword = await bcrypt.hash(cleanActionPass, 10);
      } else if (newActionPassword === null || newActionPassword === "") {
        user.actionPassword = null;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: `Password for user "${user.username}" has been successfully updated!`,
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Safety check: Prevent deleting owner if it's the only owner
    if (user.role === "OWNER") {
      const ownerCount = await User.count({ where: { role: "OWNER" } });
      if (ownerCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the only OWNER account in the system." });
      }
    }

    await user.destroy();
    res.json({ success: true, message: `User "${user.username}" deleted successfully!` });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
