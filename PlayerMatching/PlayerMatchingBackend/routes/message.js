import express from "express";
import mongoose from "mongoose";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Access the Socket.IO instance
let io;
export const setIo = (socketIo) => {
  io = socketIo;
};

// @route   POST api/messages
// @desc    Send a new message
// @access  Private
router.post("/", auth, async (req, res) => {
  const { conversationId, content } = req.body;

  try {
    if (!conversationId || !content) {
      return res.status(400).json({ msg: "Conversation ID and content are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ msg: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(401).json({ msg: "Not authorized to send messages in this conversation" });
    }

    const messageId = new mongoose.Types.ObjectId().toString(); // Generate unique messageId
    const newMessage = new Message({
      _id: new mongoose.Types.ObjectId(),
      conversation: conversationId,
      sender: req.user.id,
      content,
      messageId,
      timestamp: new Date(),
    });

    const message = await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id).populate("sender", "username avatar");

    // Emit the message to the conversation room via Socket.IO
    io.to(conversationId).emit("receive_message", {
      messageId,
      chatId: conversationId,
      sender: req.user.id,
      senderName: populatedMessage.sender.username,
      pic: populatedMessage.sender.avatar,
      text: content,
      timestamp: populatedMessage.timestamp,
      _id: populatedMessage._id,
      conversation: populatedMessage.conversation,
      senderInfo: {
        _id: populatedMessage.sender._id,
        username: populatedMessage.sender.username,
        avatar: populatedMessage.sender.avatar,
      },
    });

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Error in POST /api/messages:", err.message);
    if (err.code === 11000) { // Duplicate key error
      return res.status(400).json({ msg: "Duplicate message detected" });
    }
    res.status(500).json({ msg: "Server Error" });
  }
});

// @route   GET api/messages/:conversationId
// @desc    Get all messages for a specific conversation
// @access  Private
router.get("/:conversationId", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
      return res.status(400).json({ msg: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(401).json({ msg: "Not authorized to view this conversation" });
    }

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate("sender", "username avatar")
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error in GET /api/messages/:conversationId:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Conversation not found" });
    }
    res.status(500).json({ msg: "Server Error" });
  }
});

export default router;
