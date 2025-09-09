import express from "express"
import { fileURLToPath } from "url"
import path from "path"
import Player from "../models/player.js"
import { auth } from "../middleware/auth.js"
import User from "../models/user.js"
import { Types } from "mongoose"

const router = express.Router()

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// @route   POST api/players
// @desc    Create a new player profile
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { playerData } = req.body
    if (!playerData) {
      console.error("Player data is required", playerData)
      return res.status(400).json({ msg: "Player data is required" })
    }
    // console1.log("Received player data:", playerData);
    const {
      name,
      position,
      rating,
      badges,
      console1,
      timezone,
      attributes,
      bio,
      isAvailable,
      price,
      currency,
      photoUrl,
      screenshotUrl,
    } = playerData

    // Validate required fields
    if (!name || !position || !rating || !console1 || !timezone) {
      console.error("Missing required fields:", { name, position, rating, console1, timezone })
      return res.status(400).json({ msg: "Missing required fields: name, position, rating, console, timezone" })
    }

    // Create new player instance
    const newPlayer = new Player({
      owner: req.user.id,
      name,
      position,
      rating: Number(rating),
      badges,
      console: console1,
      timezone,
      attributes,
      bio,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      price,
      currency,
      photo: photoUrl ? photoUrl : "/placeholder.svg?height=100&width=100",
      screenshot: screenshotUrl ? screenshotUrl : "/placeholder.svg?height=100&width=100",
    })

    const player = await newPlayer.save()

    // Update user's players array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { players: player._id },
      $inc: { totalPlayers: 1 },
    })

    res.status(201).json(player)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ msg: "Server Error" })
  }
})

// @route   GET api/players
// @desc    Get all player profiles (with optional filters/search)
// @access  Public
router.get("/", auth, async (req, res) => {
  try {
    const { position, console, timezone, minRating, maxRating, status, search, owner, nba2kTitle } = req.query
    const query = {}

    // Get current user to check their role
    const currentUser = await User.findById(req.user.id)
    
    // Role-based visibility: customers cannot see admin players
    if (!currentUser.isAdmin) {
      const adminUsers = await User.find({ isAdmin: true }).select("_id")
      query.owner = { $nin: adminUsers.map(user => user._id) }
    }

    // Build query for player fields
    if (position) query.position = position
    if (console) query.console = console
    if (timezone) query.timezone = timezone
    if (minRating) query.rating = { ...query.rating, $gte: Number.parseInt(minRating) }
    if (maxRating) query.rating = { ...query.rating, $lte: Number.parseInt(maxRating) }
    
    if (status === "online") {
      const onlineUsers = await User.find({ isOnline: true }).select("_id")
      // If customer, exclude admin users from online filter
      if (!currentUser.isAdmin) {
        const adminUsers = await User.find({ isAdmin: true }).select("_id")
        const adminIds = adminUsers.map(user => user._id.toString())
        const filteredOnlineUsers = onlineUsers.filter(user => 
          !adminIds.includes(user._id.toString())
        )
        query.owner = { $in: filteredOnlineUsers.map(user => user._id) }
      } else {
        query.owner = { $in: onlineUsers.map(user => user._id) }
      }
    } else if (status === "available") {
      query.isAvailable = true
    }
    
    if (owner && Types.ObjectId.isValid(owner)) {
      // If customer tries to search for admin's players, prevent it
      if (!currentUser.isAdmin) {
        const ownerUser = await User.findById(owner)
        if (ownerUser && ownerUser.isAdmin) {
          return res.json([]) // Return empty array if customer tries to see admin players
        }
      }
      query.owner = owner
    }
    
    if (nba2kTitle) {
      const usersWithNba2kTitle = await User.find({ nba2kTitle }).select("_id")
      // If customer, exclude admin users from nba2k title filter
      if (!currentUser.isAdmin) {
        const adminUsers = await User.find({ isAdmin: true }).select("_id")
        const adminIds = adminUsers.map(user => user._id.toString())
        const filteredUsers = usersWithNba2kTitle.filter(user => 
          !adminIds.includes(user._id.toString())
        )
        query.owner = { $in: filteredUsers.map(user => user._id) }
      } else {
        query.owner = { $in: usersWithNba2kTitle.map(user => user._id) }
      }
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
        { "badges.name": { $regex: search, $options: "i" } },
      ]
    }

    const players = await Player.find(query).populate("owner", "username joinDate totalPlayers isOnline lastSeen nba2kTitle")
    res.json(players)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ msg: "Server Error" })
  }
})

// @route   GET api/players/:id
// @desc    Get a single player profile by ID
// @access  Public
router.get("/:id", auth, async (req, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid player ID" })
    }
    const player = await Player.findById(req.params.id).populate(
      "owner",
      "username joinDate totalPlayers isOnline lastSeen",
    )
    if (!player) {
      return res.status(404).json({ msg: "Player not found" })
    }
    if (!player.owner) {
      return res.status(404).json({ msg: "Player's Owner not found" })
    }
    res.json(player)
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid player ID" })
    }
    res.status(500).json({ msg: "Server Error" })
  }
})

// @route   PUT api/players/:id
// @desc    Update a player profile
// @access  Private (owner only)
router.put(
  "/:id",
  auth,
  async (req, res) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: "Invalid player ID" });
      }
      let player = await Player.findById(req.params.id);
      if (!player) {
        return res.status(404).json({ msg: "Player not found" });
      }
      if (player.owner.toString() !== req.user.id && !req.user.isAdmin) {
        return res.status(401).json({ msg: "User not authorized" });
      }

      const { playerData } = req.body;
      console.log('Received player data:', playerData);
      if (!playerData) {
        return res.status(400).json({ msg: "Player data is required" });
      }

      // Build updateData object, only including fields that are provided and non-empty for certain fields
      const updateData = {};
      if (playerData.name !== undefined) updateData.name = playerData.name;
      if (playerData.position !== undefined) updateData.position = playerData.position;
      if (playerData.rating !== undefined) updateData.rating = Number(playerData.rating);
      if (playerData.badges !== undefined) updateData.badges = playerData.badges;
      if (playerData.console !== undefined) updateData.console = playerData.console;
      if (playerData.timezone !== undefined) updateData.timezone = playerData.timezone;
      if (playerData.attributes !== undefined) updateData.attributes = playerData.attributes;
      if (playerData.bio !== undefined) updateData.bio = playerData.bio;
      if (playerData.isAvailable !== undefined) updateData.isAvailable = playerData.isAvailable;
      if (playerData.price !== undefined) updateData.price = playerData.price;
      if (playerData.currency !== undefined) updateData.currency = playerData.currency;
      if (playerData.photoUrl !== undefined && playerData.photoUrl !== '') updateData.photo = playerData.photoUrl;
      if (playerData.screenshotUrl !== undefined && playerData.screenshotUrl !== '') updateData.screenshot = playerData.screenshotUrl;

      // Only update if there are fields to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ msg: "No valid fields provided for update" });
      }

      player = await Player.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate("owner", "username joinDate totalPlayers isOnline lastSeen");
      res.json(player);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(400).json({ msg: "Invalid player ID" });
      }
      res.status(500).json({ msg: "Server Error" });
    }
  }
);
// @route   DELETE api/players/:id
// @desc    Delete a player profile
// @access  Private (owner only)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid player ID" })
    }
    const player = await Player.findById(req.params.id)
    if (!player) {
      return res.status(404).json({ msg: "Player not found" })
    }
    console.log("Player owner:", player.owner.toString(), "Requesting user:", req.user.id);
    
    if (player.owner.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ msg: "User not authorized" })
    }

    await Player.findByIdAndDelete(req.params.id)
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { players: req.params.id },
      $inc: { totalPlayers: -1 },
    })

    res.json({ msg: "Player removed" })
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid player ID" })
    }
    res.status(500).json({ msg: "Server Error" })
  }
})

export default router
