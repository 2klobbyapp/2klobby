"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { ArrowLeft, User, Clock, Save, Bell, Shield, Gamepad2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import Button from "../components/Button"
import API from "../api/api"
import { useAuth } from "../context/AuthContext"
import { io, type Socket } from "socket.io-client"

const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace("/api", "") || "http://localhost:localhost:5000"

  const [settings, setSettings] = useState({
    username: "",
    email: "",
    timezone: "",
    preferredConsole: "",
    nba2kTitle: "",
    gameModes: [] as string[],
    bio: "",
    isOnline: false,
    messageNotifications: true,
    inviteNotifications: true,
    gameUpdateNotifications: false,
    profileVisibility: "public",
    showOnlineStatus: true,
    allowInvites: true,
  })

  const timezones = ["EST", "CST", "MST", "PST", "GMT", "CET", "JST", "AEST", "UTC", "BRT", "ART"]
  const consoles = ["PlayStation 5", "Xbox Series X", "Xbox Series S", "PC", "PlayStation 4", "Xbox One"]
  const nba2kTitles = ["2K26", "2K25", "2K24"]
  const availableGameModes = ["REC", "Pro-Am", "Park"]

  // Initialize Socket.IO for online status updates
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const newSocket = io(backendUrl, {
      transports: ["websocket"],
      auth: {
        token: localStorage.getItem("token"),
      },
    })

    newSocket.on("connect", () => {
      console.log("Socket.IO connected for settings:", newSocket.id)
    })

    newSocket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message)
      setError("Failed to connect to server for status updates.")
    })

    socketRef.current = newSocket

    return () => {
      newSocket.disconnect()
    }
  }, [isAuthenticated, user, backendUrl])

  const fetchUserSettings = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.error("Cannot fetch settings: user is not authenticated or user is null", { isAuthenticated, user })
      setError("Please log in to view your settings.")
      setLoading(false)
      return
    }

    if (!user.id) {
      console.error("Invalid user ID:", user.id)
      setError("Invalid user ID. Please log in again.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("Fetching user settings for user ID:", user.id)
      const response = await API.get("/users/me")
      const userData = response.data
      console.log("Fetched user settings:", userData)

      setSettings((prev) => ({
        ...prev,
        username: userData.username || "",
        email: userData.email || "",
        timezone: userData.timezone || "",
        preferredConsole: userData.preferredConsole || "",
        nba2kTitle: userData.nba2kTitle || "",
        gameModes: userData.gameModes || [],
        bio: userData.bio || "",
        isOnline: userData.isOnline ?? false,
        profileVisibility: userData.profileVisibility || "public",
        showOnlineStatus: userData.showOnlineStatus ?? true,
        allowInvites: userData.allowInvites ?? true,
        // Handle notification settings with defaults
        messageNotifications: userData.messageNotifications ?? true,
        inviteNotifications: userData.inviteNotifications ?? true,
        gameUpdateNotifications: userData.gameUpdateNotifications ?? false,
      }))
    } catch (err: any) {
      console.error("Failed to fetch user settings:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to load user settings.")
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!authLoading) {
      fetchUserSettings()
    }
  }, [authLoading, fetchUserSettings])

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccessMessage(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [error, successMessage])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleGameModeChange = (gameMode: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      gameModes: checked ? [...prev.gameModes, gameMode] : prev.gameModes.filter((mode) => mode !== gameMode),
    }))
  }

  const handleSave = async () => {
    if (!user || !user.id) {
      console.error("Cannot save settings: user or user.id is missing", { user })
      setError("Cannot save settings: user data is incomplete.")
      return
    }

    if (!updateUser) {
      console.error("updateUser is not defined in AuthContext")
      setError("Authentication context error: updateUser function is missing.")
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const payload = {
        username: settings.username,
        email: settings.email,
        timezone: settings.timezone,
        preferredConsole: settings.preferredConsole,
        nba2kTitle: settings.nba2kTitle,
        gameModes: settings.gameModes,
        bio: settings.bio,
        isOnline: settings.isOnline,
        profileVisibility: settings.profileVisibility,
        showOnlineStatus: settings.showOnlineStatus,
        allowInvites: settings.allowInvites,
        // Include notification settings in payload
        messageNotifications: settings.messageNotifications,
        inviteNotifications: settings.inviteNotifications,
        gameUpdateNotifications: settings.gameUpdateNotifications,
      }

      console.log("Saving settings for user ID:", user.id, "payload:", payload)
      const response = await API.put("/users/me", payload)
      console.log("Settings saved:", response.data)

      // Update AuthContext with new user data
      const updatedUser = {
        id: response.data._id,
        username: response.data.username,
        email: response.data.email,
        timezone: response.data.timezone,
        preferredConsole: response.data.preferredConsole,
        nba2kTitle: response.data.nba2kTitle,
        gameModes: response.data.gameModes,
        bio: response.data.bio,
        isOnline: response.data.isOnline,
        joinDate: response.data.joinDate,
        totalPlayers: response.data.totalPlayers,
        lastSeen: response.data.lastSeen,
        profileVisibility: response.data.profileVisibility,
        showOnlineStatus: response.data.showOnlineStatus,
        allowInvites: response.data.allowInvites,
        messageNotifications: response.data.messageNotifications,
        inviteNotifications: response.data.inviteNotifications,
        gameUpdateNotifications: response.data.gameUpdateNotifications,
      }

      console.log("Calling updateUser with:", updatedUser)
      updateUser(updatedUser)

      // Emit Socket.IO event for online status update
      if (socketRef.current) {
        socketRef.current.emit(settings.isOnline ? "goOnline" : "goOffline", user.id)
        console.log(`Emitted ${settings.isOnline ? "goOnline" : "goOffline"} for user ID:`, user.id)
      }

      setSuccessMessage("Settings saved successfully!")
    } catch (err: any) {
      console.error("Failed to save settings:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600 px-4">
        <div className="text-center">
          <p className="text-lg sm:text-xl">Please log in to view your settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              to="/dashboard"
              className="p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Profile Settings */}
          <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Profile Settings</h2>
                <p className="text-sm sm:text-base text-gray-600">Update your basic profile information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={settings.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your username"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">This is how other players will see you</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={settings.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your email"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Your login email address</p>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    id="timezone"
                    name="timezone"
                    value={settings.timezone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white text-base"
                  >
                    <option value="">Select Timezone</option>
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Used for scheduling games and availability</p>
              </div>

              <div>
                <label htmlFor="preferredConsole" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Console
                </label>
                <div className="relative">
                  <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    id="preferredConsole"
                    name="preferredConsole"
                    value={settings.preferredConsole}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white text-base"
                  >
                    <option value="">Select Console</option>
                    {consoles.map((console) => (
                      <option key={console} value={console}>
                        {console}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Your primary gaming platform</p>
              </div>

              <div>
                <label htmlFor="nba2kTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  NBA 2K Title
                </label>
                <div className="relative">
                  <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    id="nba2kTitle"
                    name="nba2kTitle"
                    value={settings.nba2kTitle}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white text-base"
                  >
                    <option value="">Select NBA 2K Title</option>
                    {nba2kTitles.map((title) => (
                      <option key={title} value={title}>
                        NBA {title}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Your preferred NBA 2K game version</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Game Modes</label>
                <div className="space-y-3">
                  {availableGameModes.map((mode) => (
                    <label key={mode} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.gameModes.includes(mode)}
                        onChange={(e) => handleGameModeChange(mode, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 font-medium">{mode}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  Select your preferred game modes for matchmaking
                </p>
              </div>

              <div className="lg:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={settings.bio}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base resize-none"
                  placeholder="Tell us about yourself, your playstyle, or what you're looking for."
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{settings.bio.length}/500 characters</p>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm sm:text-base text-gray-600">Control what notifications you receive</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-lg">
                <div className="flex-1 pr-4">
                  <div className="font-medium text-sm sm:text-base text-gray-900">Message Notifications</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    Get notified when you receive new messages
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    name="messageNotifications"
                    checked={settings.messageNotifications}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 sm:w-12 sm:h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-lg">
                <div className="flex-1 pr-4">
                  <div className="font-medium text-sm sm:text-base text-gray-900">Game Invitations</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    Get notified when players invite you to games
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    name="inviteNotifications"
                    checked={settings.inviteNotifications}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 sm:w-12 sm:h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-lg">
                <div className="flex-1 pr-4">
                  <div className="font-medium text-sm sm:text-base text-gray-900">Game Updates</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    Get notified about NBA 2K updates and news
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-manipulation touch-manipulation">
                  <input
                    type="checkbox"
                    name="gameUpdateNotifications"
                    checked={settings.gameUpdateNotifications}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 sm:w-12 sm:h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Privacy & Security */}
          <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Privacy & Security</h2>
                <p className="text-sm sm:text-base text-gray-600">Control who can see your information</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Visibility
                </label>
                <select
                  id="profileVisibility"
                  name="profileVisibility"
                  value={settings.profileVisibility}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                >
                  <option value="public">Public - Anyone can view your profile</option>
                  <option value="friends">Friends Only - Only connected players can view</option>
                  <option value="private">Private - Only you can view your profile</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-lg">
                <div className="flex-1 pr-4">
                  <div className="font-medium text-sm sm:text-base text-gray-900">Show Online Status</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    Let others see when you're online and available
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    name="showOnlineStatus"
                    checked={settings.showOnlineStatus}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 sm:w-12 sm:h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-lg">
                <div className="flex-1 pr-4">
                  <div className="font-medium text-sm sm:text-base text-gray-900">Allow Game Invites</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    Let other players send you game invitations
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    name="allowInvites"
                    checked={settings.allowInvites}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 sm:w-12 sm:h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Link to="/dashboard" className="order-2 sm:order-1">
              <Button
                variant="outline"
                disabled={saving}
                className="w-full sm:w-auto min-h-[48px] px-6 touch-manipulation bg-transparent"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              loading={saving}
              className="order-1 sm:order-2 w-full sm:w-auto px-6 sm:px-8 flex items-center justify-center space-x-2 min-h-[48px] touch-manipulation"
            >
              <Save size={18} />
              <span>Save Changes</span>
            </Button>
          </div>

          {/* Toast Notifications */}
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 space-y-2 max-w-sm w-full px-4 sm:px-0">
            {error && (
              <div className="animate-slide-in bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
                <span className="block text-sm sm:text-base">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="animate-slide-in bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg">
                <span className="block text-sm sm:text-base">{successMessage}</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default SettingsPage
