import express from "express"
import { Types } from "mongoose"
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
    console.error("Error fetching users:", err.message)
    res.status(500).json({ message: "Server Error" })
  }
})

// Ban a user (admin only)
router.post("/users/:id/ban", adminAuth, async (req, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" })
    }

    const { reason } = req.body
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Ban reason is required" })
    }

    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.isBanned) {
      return res.status(400).json({ message: "User is already banned" })
    }

    // Prevent banning other admins
    if (user.isAdmin && user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Cannot ban other admin accounts" })
    }

    user.isBanned = true
    user.banReason = reason.trim()
    user.bannedBy = req.user.id
    user.banDate = new Date()
    await user.save()

    console.log(`Admin ${req.user.username || req.user.id} banned user ${user.username} (${req.params.id}). Reason: ${reason}`)

    res.json({ message: "User banned successfully" })
  } catch (err) {
    console.error("Error banning user:", err.message)
    res.status(500).json({ message: "Failed to ban user" })
  }
})

// Unban a user (admin only)
router.post("/users/:id/unban", adminAuth, async (req, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" })
    }

    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!user.isBanned) {
      return res.status(400).json({ message: "User is not banned" })
    }

    user.isBanned = false
    user.banReason = ""
    user.bannedBy = null
    user.banDate = null
    await user.save()

    console.log(`Admin ${req.user.username || req.user.id} unbanned user ${user.username} (${req.params.id})`)

    res.json({ message: "User unbanned successfully" })
  } catch (err) {
    console.error("Error unbanning user:", err.message)
    res.status(500).json({ message: "Failed to unban user" })
  }
})

// Delete a user (admin only)
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" })
    }

    const userToDelete = await User.findById(req.params.id)
    
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" })
    }

    // Prevent deletion of other admin accounts (safety measure)
    if (userToDelete.isAdmin && userToDelete._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Cannot delete other admin accounts" })
    }

    // Store user info before deletion
    const deletedUserInfo = {
      username: userToDelete.username,
      id: userToDelete._id.toString()
    }

    try {
      // Delete all players owned by this user - using correct field name 'owner'
      const playersResult = await Player.deleteMany({ owner: req.params.id })
      console.log(`Deleted ${playersResult.deletedCount} players for user ${deletedUserInfo.username}`)
      
      // Delete the user account using findByIdAndDelete (non-deprecated method)
      const deletedUser = await User.findByIdAndDelete(req.params.id)
      
      if (!deletedUser) {
        return res.status(404).json({ message: "User not found during deletion" })
      }

      // Log the deletion for audit purposes
      console.log(`Admin ${req.user.username || req.user.id} deleted user ${deletedUserInfo.username} (${deletedUserInfo.id}). ${playersResult.deletedCount} players removed.`)

      res.json({ 
        message: "User account and all associated data deleted successfully",
        username: deletedUserInfo.username,
        playersDeleted: playersResult.deletedCount,
        deletedAt: new Date().toISOString()
      })

    } catch (deleteErr) {
      console.error("Error during deletion operations:", deleteErr)
      throw deleteErr
    }

  } catch (err) {
    console.error("Error deleting user:", err.message, err.stack)
    if (err.kind === "ObjectId" || err.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" })
    }
    res.status(500).json({ 
      message: "Failed to delete user", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    })
  }
})

// Get system stats (admin only)
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalPlayers: await Player.countDocuments(),
      bannedUsers: await User.countDocuments({ isBanned: true }),
      onlineUsers: await User.countDocuments({ isOnline: true }),
      adminUsers: await User.countDocuments({ isAdmin: true })
    }
    
    res.json(stats)
  } catch (err) {
    console.error("Error fetching stats:", err.message)
    res.status(500).json({ message: "Server Error" })
  }
})

export default router