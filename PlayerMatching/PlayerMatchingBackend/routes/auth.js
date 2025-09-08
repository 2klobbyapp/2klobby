import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/user.js"
import sendEmail from "../utils/sendEmail.js"

const router = express.Router()

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
async function sendRegistrationEmailtoAdmin(username, email, user) {
  try {
    await sendEmail({
      to: "2klobbyapp@gmail.com",
      subject: "New User Registration",
      text: `A new user has been registered!\n\nUsername: ${username}\nEmail: ${email}\nJoin Date: ${user.joinDate.toISOString()}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New User Registration - 2kLobby</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #1a73e8;
      padding: 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .content p {
      line-height: 1.6;
      margin: 10px 0;
    }
    .user-info {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .user-info p {
      margin: 8px 0;
      font-size: 16px;
    }
    .user-info strong {
      color: #1a73e8;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #1a73e8;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #1557b0;
    }
    .footer {
      background-color: #f4f4f4;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    @media screen and (max-width: 600px) {
      .container {
        margin: 10px;
      }
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New User Registration</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We’re excited to announce that a new user has joined the 2kLobby community!</p>
      <div class="user-info">
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Join Date:</strong> ${user.joinDate.toISOString()}</p>
      </div>
      <p>Visit the 2kLobby platform to view more details and manage user activity.</p>
      <a href="https://2klobby.com" class="button">Visit 2kLobby</a>
    </div>
    <div class="footer">
      <p>&copy; 2025 2kLobby. All rights reserved.</p>
      <p>Questions? Contact us at <a href="mailto:support@2klobby.com">support@2klobby.com</a></p>
    </div>
  </div>
</body>
</html>
      `
    });
  } catch (emailError) {
    console.error("Failed to send registration email:", emailError.message);
    // Don't fail the registration if email fails
  }
}
async function sendRegistrationEmailtoUser(username, email, user) {
  try {
    await sendEmail({
      to: email,
      subject: "🎉 Welcome to 2kLobby, " + username + "!",
      text: `Hi ${username},

Welcome to 2kLobby! We're excited to have you join the community.

Here are your account details:

Username: ${username}
Email: ${email}
Join Date: ${user.joinDate.toISOString()}

Start exploring now and connect with other players at 2kLobby!`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to 2kLobby!</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #f0f2f5;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1a73e8, #0d47a1);
      padding: 30px;
      text-align: center;
      color: #fff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 1px;
    }
    .content {
      padding: 30px;
      line-height: 1.6;
      color: #444;
    }
    .content h2 {
      color: #1a73e8;
      margin-top: 0;
    }
    .user-info {
      background: #f9fbff;
      border: 1px solid #e1e8f0;
      border-radius: 8px;
      padding: 15px 20px;
      margin: 20px 0;
    }
    .user-info p {
      margin: 8px 0;
      font-size: 15px;
    }
    .user-info strong {
      color: #0d47a1;
    }
    .button {
      display: inline-block;
      background: #1a73e8;
      color: #fff !important;
      padding: 14px 28px;
      border-radius: 6px;
      font-weight: bold;
      text-decoration: none;
      margin: 25px 0;
      transition: background 0.3s ease;
    }
    .button:hover {
      background: #0d47a1;
    }
    .footer {
      background: #f0f2f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
    }
    .footer a {
      color: #1a73e8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to 2kLobby 🎮</h1>
    </div>
    <div class="content">
      <h2>Hey ${username}, we're glad you're here!</h2>
      <p>You’ve successfully joined <strong>2kLobby</strong> – the ultimate hub for NBA 2K players. Connect, compete, and grow with a community that shares your passion for the game.</p>
      
      <div class="user-info">
        <p><strong>👤 Username:</strong> ${username}</p>
        <p><strong>📧 Email:</strong> ${email}</p>
        <p><strong>📅 Join Date:</strong> ${user.joinDate.toISOString()}</p>
      </div>

      <p>Jump in now and start exploring matchups, connecting with other players, and showing your skills.</p>
      <p style="text-align:center;">
        <a href="https://2klobby.com" class="button">Explore 2kLobby</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 2kLobby. All rights reserved.</p>
      <p>Need help? Contact us at <a href="mailto:support@2klobby.com">support@2klobby.com</a></p>
    </div>
  </div>
</body>
</html>
      `
    });
  } catch (emailError) {
    console.error("Failed to send registration email:", emailError.message);
    // Don't fail the registration if email fails
  }
}

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body

  try {
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ msg: "Please provide all required fields" })
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" })
    }

    // Check if user exists
    let user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ msg: "User already exists" })
    }

    // Check if username is taken
    user = await User.findOne({ username })
    if (user) {
      return res.status(400).json({ msg: "Username already taken" })
    }

    // Create new user instance
    user = new User({
      username,
      email,
      password,
    })

    // Hash password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)

    // Save user to database
    await user.save()

    // Send email notification to 2klobbyapp@gmail.com
    sendRegistrationEmailtoAdmin(username, email, user).catch(err => {
      console.error("Error sending registration email:", err.message);
    });
    sendRegistrationEmailtoUser(username, email, user).catch(err => {
      console.error("Error sending registration email:", err.message);
    });
    // Return JWT
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" }, (err, token) => {
      if (err) throw err
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      })
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: "Please provide email and password" })
    }

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" })
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        msg: "Your account has been banned",
        banReason: user.banReason,
      })
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" })
    }

    // Return JWT
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isBanned: user.isBanned,
      },
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" }, (err, token) => {
      if (err) throw err

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isBanned: user.isBanned,
        banReason: user.banReason,
        joinDate: user.joinDate,
        totalPlayers: user.totalPlayers,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        profileVisibility: user.profileVisibility,
        showOnlineStatus: user.showOnlineStatus,
        allowInvites: user.allowInvites,
        preferredConsole: user.preferredConsole,
        timezone: user.timezone,
      }

      res.json({ token, user: userData })
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

export default router