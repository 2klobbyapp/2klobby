import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import cors from "cors"
import { createServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import jwt from "jsonwebtoken"
import Conversation from "./models/conversation.js"
import User from "./models/user.js"
import { setIo } from "./routes/message.js" // Import setIo to pass Socket.IO instance

// Load env variables first
dotenv.config()

// Validate required environment variables
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"]
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(", ")}`)
  console.error("Please set these variables in your Render dashboard")
  process.exit(1)
}

// Import routes
import authRoutes from "./routes/auth.js"
import playerRoutes from "./routes/player.js"
import messageRoutes from "./routes/message.js"
import conversationRoutes from "./routes/conversation.js"
import userRoutes from "./routes/user.js"
import adminRoutes from "./routes/admin.js"

const app = express()
const httpServer = createServer(app)

// CORS configuration - automatically handles localhost and deployed URLs
const getAllowedOrigins = () => {
  const origins = ["http://localhost:3000", "http://localhost:5000", "http://localhost:5173", "https://localhost:5000"]
  if (process.env.FRONTEND_URL) origins.push(process.env.FRONTEND_URL)
  if (process.env.RENDER_EXTERNAL_URL) origins.push(process.env.RENDER_EXTERNAL_URL)
  if (process.env.NETLIFY_URL) origins.push(process.env.NETLIFY_URL)
  if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`)
  return origins.filter(Boolean)
}

const allowedOrigins = getAllowedOrigins()

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
})

// Pass Socket.IO instance to message routes
setIo(io)

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.log(`🚫 CORS blocked origin: ${origin}`)
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message)
    process.exit(1)
  }
}

connectDB()

// Store connected users
const connectedUsers = new Map()

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error("No token provided"))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.user.id)

    if (!user) {
      return next(new Error("User not found"))
    }

    socket.userId = user._id.toString()
    socket.user = user
    next()
  } catch (error) {
    console.error("Socket authentication error:", error.message)
    next(new Error("Authentication failed"))
  }
}

io.use(authenticateSocket)

io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id)

  socket.on("setup", async (data) => {
    try {
      const userId = data.id || socket.userId
      connectedUsers.set(userId, {
        socketId: socket.id,
        userId,
        username: data.userName || socket.user.username,
        isOnline: true,
      })

      socket.join(userId)
      socket.emit("connected")

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      })

      socket.broadcast.emit("userStatusUpdate", {
        userId,
        isOnline: true,
      })

      console.log(`🟢 User ${data.userName || socket.user.username} (${userId}) setup completed`)
    } catch (error) {
      console.error("Setup error:", error.message)
      socket.emit("error", "Setup failed")
    }
  })

  socket.on("enterroom", (roomId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        console.error(`❌ Invalid roomId: ${roomId}`)
        return
      }
      if (!socket.rooms.has(roomId)) {
        socket.join(roomId)
        console.log(`🏠 User ${socket.user.username} joined room: ${roomId}`)
      } else {
        console.log(`🏠 User ${socket.user.username} already in room: ${roomId}`)
      }
    } catch (error) {
      console.error("Enter room error:", error.message)
    }
  })

  socket.on("leaveroom", (roomId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        console.error(`❌ Invalid roomId: ${roomId}`)
        return
      }
      socket.leave(roomId)
      console.log(`👋 User ${socket.user.username} left room: ${roomId}`)
    } catch (error) {
      console.error("Leave room error:", error.message)
    }
  })

  socket.on("new_message", async (data) => {
    try {
      const { chat, message, sender, pic, senderName, messageId, timestamp, _id } = data

      if (!chat?.chat?._id || !message || !sender || !messageId || !_id) {
        console.error("Invalid message data:", JSON.stringify(data, null, 2))
        socket.emit("error", "Invalid message data")
        return
      }

      if (!mongoose.Types.ObjectId.isValid(chat.chat._id) || !mongoose.Types.ObjectId.isValid(sender)) {
        console.error(`❌ Invalid IDs: ${chat.chat._id}, ${sender}`)
        socket.emit("error", "Invalid IDs")
        return
      }

      const conversation = await Conversation.findById(chat.chat._id)
      if (!conversation) {
        console.error(`❌ Conversation not found: ${chat.chat._id}`)
        socket.emit("error", "Conversation not found")
        return
      }

      if (!conversation.participants.includes(sender)) {
        console.error(`❌ Sender not in conversation: ${sender}`)
        socket.emit("error", "Not authorized to send message")
        return
      }

      // Message is already saved by POST /api/messages, just broadcast it
      const messageData = {
        messageId,
        chatId: chat.chat._id,
        sender,
        senderName,
        pic,
        text: message,
        timestamp,
        _id,
        conversation: chat.chat._id,
        isGroup: conversation.isGroup,
        groupName: conversation.groupName,
        senderInfo: {
          _id: sender,
          username: senderName,
          avatar: pic,
        },
      }

      io.to(chat.chat._id).emit("receive_message", messageData)

      const chatType = conversation.isGroup ? `group "${conversation.groupName}"` : "chat"
      console.log(`💬 Message broadcast to ${chatType} ${chat.chat._id}: ${messageId}`)
    } catch (error) {
      console.error("Message broadcasting error:", error.message)
      socket.emit("error", "Failed to broadcast message")
    }
  })

  socket.on("typing", (data) => {
    try {
      const { chat, sender, senderName } = data
      if (!chat?.chat?._id || !sender) return
      if (!mongoose.Types.ObjectId.isValid(chat.chat._id)) {
        console.error(`❌ Invalid chat ID: ${chat.chat._id}`)
        return
      }
      io.to(chat.chat._id).emit("typing", { sender, senderName })
    } catch (error) {
      console.error("Typing error:", error.message)
    }
  })

  socket.on("typingStop", (data) => {
    try {
      const { chat, sender, senderName } = data
      if (!chat?.chat?._id || !sender) return
      if (!mongoose.Types.ObjectId.isValid(chat.chat._id)) {
        console.error(`❌ Invalid chat ID: ${chat.chat._id}`)
        return
      }
      io.to(chat.chat._id).emit("typingStop", { sender, senderName })
    } catch (error) {
      console.error("Typing stop error:", error.message)
    }
  })

  socket.on("group_created", async (data) => {
    try {
      const { groupId, participants, groupName, creatorName } = data

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        console.error(`❌ Invalid group ID: ${groupId}`)
        return
      }

      // Notify all participants about the new group
      participants.forEach((participantId) => {
        if (participantId !== socket.userId) {
          socket.to(participantId).emit("group_invitation", {
            groupId,
            groupName,
            creatorName,
            message: `You've been added to the group "${groupName}" by ${creatorName}`,
          })
        }
      })

      console.log(`👥 Group "${groupName}" created by ${creatorName}`)
    } catch (error) {
      console.error("Group creation notification error:", error.message)
    }
  })

  socket.on("group_deleted", async (data) => {
    try {
      const { groupId, participants, groupName, adminName } = data

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        console.error(`❌ Invalid group ID: ${groupId}`)
        return
      }

      // Notify all participants about group deletion
      participants.forEach((participantId) => {
        if (participantId !== socket.userId) {
          socket.to(participantId).emit("group_deleted", {
            groupId,
            groupName,
            adminName,
            message: `The group "${groupName}" has been deleted by ${adminName}`,
          })
        }
      })

      // Remove all users from the group room
      io.in(groupId).socketsLeave(groupId)

      console.log(`🗑️ Group "${groupName}" deleted by ${adminName}`)
    } catch (error) {
      console.error("Group deletion notification error:", error.message)
    }
  })

  socket.on("disconnect", async () => {
    try {
      const userId = socket.userId
      if (userId) {
        connectedUsers.delete(userId)
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        })
        socket.broadcast.emit("userStatusUpdate", {
          userId,
          isOnline: false,
        })
        console.log(`👋 User ${socket.user?.username} (${userId}) disconnected`)
      }
    } catch (error) {
      console.error("Disconnect error:", error.message)
    }
  })
})

// Graceful error handling
process.on("unhandledRejection", (err) => {
  console.log("❌ Unhandled Rejection:", err.message)
  httpServer.close(() => {
    process.exit(1)
  })
})

process.on("uncaughtException", (err) => {
  console.log("❌ Uncaught Exception:", err.message)
  process.exit(1)
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    connectedUsers: connectedUsers.size,
  })
})

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/players", playerRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/conversations", conversationRoutes)
app.use("/api/users", userRoutes)
app.use("/api/admin", adminRoutes)

// Serve uploaded files
app.use("/uploads", express.static("uploads"))

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🏀 2K Lobby Backend API is running!",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      players: "/api/players",
      users: "/api/users",
      messages: "/api/messages",
      conversations: "/api/conversations",
      admin: "/api/admin",
    },
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size,
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ API Error:", err.stack)
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Something went wrong!" : err.message,
  })
})

const PORT = process.env.PORT || 10000

const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...")
  try {
    io.close(() => console.log("Socket.IO server closed"))
    httpServer.close(() => console.log("HTTP server closed"))
    await mongoose.connection.close()
    console.log("MongoDB connection closed")
    process.exit(0)
  } catch (error) {
    console.error("Error during shutdown:", error.message)
    process.exit(1)
  }
}

process.on("SIGTERM", async () => {
  console.log("SIGTERM received")
  await gracefulShutdown()
})

process.on("SIGINT", async () => {
  console.log("SIGINT received")
  for (const [userId] of connectedUsers) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      })
    } catch (error) {
      console.error(`Error updating user ${userId} status:`, error.message)
    }
  }
  await gracefulShutdown()
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 Socket.IO server ready for connections`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 Allowed origins: ${allowedOrigins.join(", ")}`)
})
