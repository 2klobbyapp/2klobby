import mongoose from "mongoose"

const PlayerSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
  },
  position: {
    type: String,
    required: true,
    enum: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  },
  rating: {
    type: Number,
    required: true,
    min: 60,
    max: 99,
  },
  badges: [
    {
      name: {
        type: String,
        required: true,
      },
      level: {
        type: String,
        enum: ["Bronze", "Silver", "Gold", "Hall of Fame", "Legend"],
        default: "Bronze",
      },
    },
  ],
  console: {
    type: String,
    required: true,
    enum: ["PlayStation 5", "Xbox Series X", "Xbox Series S", "PC", "PlayStation 4", "Xbox One"],
  },
  timezone: {
    type: String,
    required: true,
    enum: ["EST", "CST", "MST", "PST", "GMT", "CET", "JST", "AEST", "UTC", "BRT", "ART"],
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  gamesPlayed: {
    type: Number,
    default: 0,
    min: 0,
  },
  winRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  preferredModes: [
    {
      type: String,
      enum: ["REC", "Pro-Am", "Park", "MyCareer", "Play Now Online"],
    },
  ],
  photo: {
    type: String,
    default: "/placeholder.svg?height=100&width=100",
  },
  screenshot: {
    type: String,
    default: "/placeholder.svg?height=100&width=100",
  },
  attributes: {
    height: { type: String, required: true },
    weight: { type: String, required: true },
    wingspan: { type: String, required: true },
    closeShot: { type: Number, min: 0, max: 99, default: 0 },
    drivingLayup: { type: Number, min: 0, max: 99, default: 0 },
    drivingDunk: { type: Number, min: 0, max: 99, default: 0 },
    standingDunk: { type: Number, min: 0, max: 99, default: 0 },
    postControl: { type: Number, min: 0, max: 99, default: 0 },
    midRangeShot: { type: Number, min: 0, max: 99, default: 0 },
    threePointShot: { type: Number, min: 0, max: 99, default: 0 },
    freeThrow: { type: Number, min: 0, max: 99, default: 0 },
    passingAccuracy: { type: Number, min: 0, max: 99, default: 0 },
    ballHandle: { type: Number, min: 0, max: 99, default: 0 },
    speedWithBall: { type: Number, min: 0, max: 99, default: 0 },
    interiorDefense: { type: Number, min: 0, max: 99, default: 0 },
    perimeterDefense: { type: Number, min: 0, max: 99, default: 0 },
    steal: { type: Number, min: 0, max: 99, default: 0 },
    block: { type: Number, min: 0, max: 99, default: 0 },
    offensiveRebounding: { type: Number, min: 0, max: 99, default: 0 },
    defensiveRebounding: { type: Number, min: 0, max: 99, default: 0 },
    speed: { type: Number, min: 0, max: 99, default: 0 },
    agility: { type: Number, min: 0, max: 99, default: 0 },
    strength: { type: Number, min: 0, max: 99, default: 0 },
    vertical: { type: Number, min: 0, max: 99, default: 0 },
    stamina: { type: Number, min: 0, max: 99, default: 0 },
  },
  bio: {
    type: String,
    maxlength: 1000,
    default: "",
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  price: {
    type: String,
    default: "",
  },
  currency: {
    type: String,
    default: "",
  },
})

const Player = mongoose.model("Player", PlayerSchema)
export default Player
