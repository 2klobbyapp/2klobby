import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
  ],
  totalPlayers: {
    type: Number,
    default: 0,
  },
  avatar: {
    type: String,
    default: "/placeholder.svg?height=100&width=100",
  },
  preferredConsole: {
    type: String,
    enum: ["PlayStation 5", "Xbox Series X", "Xbox Series S", "PC", "PlayStation 4", "Xbox One", ""],
    default: "",
  },
  timezone: {
    type: String,
    enum: ["EST", "CST", "MST", "PST", "GMT", "CET", "JST", "AEST", "UTC", "BRT", "ART", ""],
    default: "",
  },
  bio: {
    type: String,
    maxlength: 500,
    default: "",
  },
  nba2kTitle: {
    type: String,
    enum: ["2K26", "2K25", "2K24", ""],
    default: "",
  },
  gameModes: {
    type: [String],
    enum: ["REC", "Pro-Am", "Park", ""],
    default: [],
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
  },
  profileVisibility: {
    type: String,
    enum: ["public", "friends", "private"],
    default: "public",
  },
  showOnlineStatus: {
    type: Boolean,
    default: true,
  },
  allowInvites: {
    type: Boolean,
    default: true,
  },
  messageNotifications: {
    type: Boolean,
    default: true,
  },
  inviteNotifications: {
    type: Boolean,
    default: true,
  },
  gameUpdateNotifications: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ""
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  banDate: {
    type: Date
  },
  favoriteTeam: {
    type: String,
    default: "",
  },
  playStyle: {
    type: String,
    enum: ["Competitive", "Casual", "Both", ""],
    default: "",
  }
})

// Ensure unique indexes for username and email
UserSchema.index({ username: 1 }, { unique: true })
UserSchema.index({ email: 1 }, { unique: true })

const User = mongoose.model("User", UserSchema)
export default User