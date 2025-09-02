import jwt from "jsonwebtoken"
import User from "../models/user.js"

const auth = async (req, res, next) => {
  // Get token from header
  const token = req.header("x-auth-token")

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" })
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.user.id)

    if (!user) {
      return res.status(401).json({ msg: "User not found" })
    }

    if (user.isBanned) {
      return res.status(403).json({
        msg: "Your account has been banned",
        banReason: user.banReason,
      })
    }

    req.user = user
    next()
  } catch (err) {
    console.error("Auth middleware error:", err.message)
    res.status(401).json({ msg: "Token is not valid" })
  }
}

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, async () => {
      if (!req.user.isAdmin) {
        return res.status(403).json({ msg: "Access denied. Admin only." })
      }
      next()
    })
  } catch (err) {
    console.error("Admin auth error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

export { auth, adminAuth }
