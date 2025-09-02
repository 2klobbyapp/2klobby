import express from "express"
import { adminAuth } from "../middleware/auth.js"
import User from "../models/user.js"
import Player from "../models/player.js"

const router = express.Router()

// Get all users (admin only)
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (err) {
    res.status(500).json({ msg: "Server Error" })
  }
})

// Ban a user (admin only)
router.post("/users/:id/ban", adminAuth, async (req, res) => {
  try {
    const { reason } = req.body
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    user.isBanned = true
    user.banReason = reason
    user.bannedBy = req.user.id
    user.banDate = Date.now()
    await user.save()

    res.json({ msg: "User banned successfully" })
  } catch (err) {
    res.status(500).json({ msg: "Server Error" })
  }
})

// Unban a user (admin only)
router.post("/users/:id/unban", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    user.isBanned = false
    user.banReason = ""
    user.bannedBy = null
    user.banDate = null
    await user.save()

    res.json({ msg: "User unbanned successfully" })
  } catch (err) {
    res.status(500).json({ msg: "Server Error" })
  }
})

// Delete a user (admin only)
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Delete associated players
    await Player.deleteMany({ user: req.params.id })
    
    // Delete the user
    await user.remove()

    res.json({ msg: "User and associated data deleted successfully" })
  } catch (err) {
    res.status(500).json({ msg: "Server Error" })
  }
})

// Get system stats (admin only)
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalPlayers: await Player.countDocuments(),
      bannedUsers: await User.countDocuments({ isBanned: true }),
      onlineUsers: await User.countDocuments({ isOnline: true })
    }
    
    res.json(stats)
  } catch (err) {
    res.status(500).json({ msg: "Server Error" })
  }
})

export default router
