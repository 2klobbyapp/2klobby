import express from "express"
import { Types } from "mongoose"
import User from "../models/user.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

// @route   GET api/users/me
// @desc    Get authenticated user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }
    res.json(user)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// @route   PUT api/users/me
// @desc    Update authenticated user profile
// @access  Private
router.put("/me", auth, async (req, res) => {
  const { 
    username, 
    email, 
    preferredConsole, 
    timezone, 
    bio, 
    isOnline, 
    profileVisibility, 
    showOnlineStatus, 
    allowInvites,
    messageNotifications,
    inviteNotifications,
    gameUpdateNotifications
  } = req.body

  // Build user fields object
  const userFields = {}
  
  // Profile fields
  if (username) userFields.username = username
  if (email) userFields.email = email
  if (preferredConsole !== undefined) userFields.preferredConsole = preferredConsole
  if (timezone !== undefined) userFields.timezone = timezone
  if (bio !== undefined) userFields.bio = bio
  
  // Online status
  if (typeof isOnline === "boolean") {
    userFields.isOnline = isOnline
    userFields.lastSeen = isOnline ? null : new Date()
  }
  
  // Privacy settings
  if (profileVisibility) userFields.profileVisibility = profileVisibility
  if (typeof showOnlineStatus === "boolean") userFields.showOnlineStatus = showOnlineStatus
  if (typeof allowInvites === "boolean") userFields.allowInvites = allowInvites
  
  // Notification settings
  if (typeof messageNotifications === "boolean") userFields.messageNotifications = messageNotifications
  if (typeof inviteNotifications === "boolean") userFields.inviteNotifications = inviteNotifications
  if (typeof gameUpdateNotifications === "boolean") userFields.gameUpdateNotifications = gameUpdateNotifications

  try {
    let user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Check if new email/username already exists for another user
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email })
      if (existingEmail && existingEmail.id !== req.user.id) {
        return res.status(400).json({ msg: "Email already in use by another account" })
      }
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username })
      if (existingUsername && existingUsername.id !== req.user.id) {
        return res.status(400).json({ msg: "Username already taken" })
      }
    }

    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true, runValidators: true, select: "-password" }
    )

    res.json(user)
  } catch (err) {
    console.error(err.message)
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Username or email already exists" })
    }
    res.status(500).send("Server Error")
  }
})

// @route   GET api/users/:id
// @desc    Get a user profile by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid user ID" })
    }

    const user = await User.findById(req.params.id).select(
      "username joinDate totalPlayers isOnline lastSeen avatar profileVisibility showOnlineStatus allowInvites preferredConsole timezone bio"
    )
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Respect privacy settings
    if (user.profileVisibility === "private") {
      return res.status(403).json({ msg: "This profile is private" })
    }

    res.json(user)
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid user ID" })
    }
    res.status(500).send("Server Error")
  }
})

export default router
