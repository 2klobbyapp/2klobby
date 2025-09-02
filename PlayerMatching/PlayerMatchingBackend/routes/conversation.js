import express from "express"
import Conversation from "../models/conversation.js"
import User from "../models/user.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

// @route   POST api/conversations
// @desc    Create or get a conversation between two users
// @access  Private
router.post("/", auth, async (req, res) => {
  const { participantId } = req.body

  try {
    if (!participantId) {
      return res.status(400).json({ msg: "Participant ID is required" })
    }

    // Sort participant IDs to ensure consistent matching
    const participants = [req.user.id, participantId].sort()

    // Check if a conversation already exists between these two users
    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
      isGroup: false,
    })

    if (conversation) {
      return res.json(conversation)
    }

    // Create a new conversation
    conversation = new Conversation({
      participants,
      isGroup: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await conversation.save()
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "username isOnline lastSeen avatar")
      .populate("lastMessage")
    res.status(201).json(populatedConversation)
  } catch (err) {
    console.error("Error in POST /api/conversations:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
})

// @route   POST api/conversations/group
// @desc    Create a group conversation
// @access  Private
router.post("/group", auth, async (req, res) => {
  const { groupName, participantIds, groupDescription } = req.body

  try {
    if (!groupName || !participantIds || participantIds.length < 2) {
      return res.status(400).json({
        msg: "Group name and at least 2 participants are required",
      })
    }

    // Add the creator to participants if not already included
    const allParticipants = [...new Set([req.user.id, ...participantIds])]

    // Validate all participants exist
    const users = await User.find({ _id: { $in: allParticipants } })
    if (users.length !== allParticipants.length) {
      return res.status(400).json({ msg: "One or more participants not found" })
    }

    // Create group conversation
    const conversation = new Conversation({
      participants: allParticipants,
      isGroup: true,
      groupName,
      groupAdmin: req.user.id,
      groupDescription: groupDescription || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await conversation.save()
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "username isOnline lastSeen avatar")
      .populate("groupAdmin", "username avatar")
      .populate("lastMessage")

    res.status(201).json(populatedConversation)
  } catch (err) {
    console.error("Error in POST /api/conversations/group:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
})

// @route   DELETE api/conversations/group/:id
// @desc    Delete a group conversation (admin only)
// @access  Private
router.delete("/group/:id", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)

    if (!conversation) {
      return res.status(404).json({ msg: "Group not found" })
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ msg: "This is not a group conversation" })
    }

    if (conversation.groupAdmin.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Only group admin can delete the group" })
    }

    await Conversation.findByIdAndDelete(req.params.id)
    res.json({ msg: "Group deleted successfully" })
  } catch (err) {
    console.error("Error in DELETE /api/conversations/group/:id:", err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Group not found" })
    }
    res.status(500).json({ msg: "Server Error" })
  }
})

// @route   GET api/conversations/users
// @desc    Get users for group creation (chat users + all users)
// @access  Private
router.get("/users", auth, async (req, res) => {
  try {
    // Get users the current user has chatted with
    const chatConversations = await Conversation.find({
      participants: req.user.id,
      isGroup: false,
    }).populate("participants", "username avatar isOnline")

    const chatUserIds = new Set()
    chatConversations.forEach((conv) => {
      conv.participants.forEach((participant) => {
        if (participant._id.toString() !== req.user.id) {
          chatUserIds.add(participant._id.toString())
        }
      })
    })

    const chatUsers = chatConversations.reduce((users, conv) => {
      conv.participants.forEach((participant) => {
        if (
          participant._id.toString() !== req.user.id &&
          !users.find((u) => u._id.toString() === participant._id.toString())
        ) {
          users.push(participant)
        }
      })
      return users
    }, [])

    // Get all users except current user
    const allUsers = await User.find({
      _id: { $ne: req.user.id },
    }).select("username avatar isOnline")

    res.json({
      chatUsers,
      allUsers,
    })
  } catch (err) {
    console.error("Error in GET /api/conversations/users:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
})

// @route   GET api/conversations
// @desc    Get all conversations for the authenticated user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate("participants", "username isOnline lastSeen avatar")
      .populate("groupAdmin", "username avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })

    res.json(conversations)
  } catch (err) {
    console.error("Error in GET /api/conversations:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
})

// @route   GET api/conversations/:id
// @desc    Get a single conversation by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("participants", "username isOnline lastSeen avatar")
      .populate("groupAdmin", "username avatar")
      .populate("lastMessage")

    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" })
    }

    if (!conversation.participants.some((p) => p._id.toString() === req.user.id)) {
      return res.status(401).json({ msg: "Not authorized to view this conversation" })
    }

    res.json(conversation)
  } catch (err) {
    console.error("Error in GET /api/conversations/:id:", err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Conversation not found" })
    }
    res.status(500).json({ msg: "Server Error" })
  }
})

export default router
