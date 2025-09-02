import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import User from "../models/user.js"

// Load env variables
dotenv.config()

const createAdmin = async () => {
  try {
    // Connect to MongoDB using environment variable
    const MONGO_URI = process.env.MONGO_URI

    if (!MONGO_URI) {
      console.error("MONGO_URI environment variable is not set")
      process.exit(1)
    }

    await mongoose.connect(MONGO_URI)
    console.log("MongoDB Connected...")

    // Admin user details - use environment variables for production
    const adminData = {
      username: process.env.ADMIN_USERNAME || "admin",
      email: process.env.ADMIN_EMAIL || "admin@gmail.com",
      password: process.env.ADMIN_PASSWORD || "admin123", // Use a stronger default
      isAdmin: true,
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [{ email: adminData.email }, { username: adminData.username }],
    })

    if (existingAdmin) {
      console.log("Admin user already exists!")
      process.exit(0)
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    adminData.password = await bcrypt.hash(adminData.password, salt)

    // Create admin user
    const admin = new User(adminData)
    await admin.save()

    console.log("Admin user created successfully!")
    console.log("Username:", adminData.username)
    console.log("Email:", adminData.email)
    console.log("Password: [HIDDEN FOR SECURITY]")
    process.exit(0)
  } catch (err) {
    console.error("Error:", err.message)
    process.exit(1)
  }
}

createAdmin()
