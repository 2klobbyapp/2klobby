"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Upload, Star, ArrowLeft } from "lucide-react"
import { Link, useParams, useNavigate } from "react-router-dom"
import Button from "../components/Button"
import API from "../api/api"
import { useAuth } from "../context/AuthContext"
import axios from "axios"

const AddPlayerPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const isEditing = Boolean(id) && id !== "undefined"
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [playerPhoto, setPlayerPhoto] = useState<File | null>(null)
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [existingScreenshotUrl, setExistingScreenshotUrl] = useState<string | null>(null)
  const [isPhotoChanged, setIsPhotoChanged] = useState(false)
  const [isScreenshotChanged, setIsScreenshotChanged] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    rating: 60,
    badges: [] as Array<{ name: string; level: string }>,
    console: "",
    timezone: "",
    attributes: {
      height: "6'0\"",
      weight: "180 lbs",
      wingspan: "6'3\"",
      closeShot: 25,
      drivingLayup: 25,
      drivingDunk: 25,
      standingDunk: 25,
      postControl: 25,
      midRangeShot: 25,
      threePointShot: 25,
      freeThrow: 25,
      passingAccuracy: 25,
      ballHandle: 25,
      speedWithBall: 25,
      interiorDefense: 25,
      perimeterDefense: 25,
      steal: 25,
      block: 25,
      offensiveRebounding: 25,
      defensiveRebounding: 25,
      speed: 25,
      agility: 25,
      strength: 25,
      vertical: 25,
      stamina: 25,
    },
    bio: "",
    isAvailable: true,
    price: "",
    currency: "",
  })

  useEffect(() => {
    if (isEditing && id && id !== "undefined" && !authLoading) {
      const fetchPlayerData = async () => {
        setLoading(true)
        try {
          const response = await API.get(`/players/${id}`)
          const playerData = response.data

          // Store existing image URLs
          if (playerData.photoUrl) {
            setExistingPhotoUrl(playerData.photoUrl)
            setScreenshotPreviewUrl(playerData.photoUrl)
          }
          if (playerData.screenshotUrl) {
            setExistingScreenshotUrl(playerData.screenshotUrl)
            setScreenshotPreviewUrl(playerData.screenshotUrl)
          }

          setFormData({
            name: playerData.name || "",
            position: playerData.position || "",
            rating: playerData.rating || 60,
            badges: playerData.badges || [],
            console: playerData.console || "",
            timezone: playerData.timezone || "",
            attributes: {
              height: playerData.attributes?.height || "6'0\"",
              weight: playerData.attributes?.weight || "180 lbs",
              wingspan: playerData.attributes?.wingspan || "6'3\"",
              closeShot: playerData.attributes?.closeShot || 25,
              drivingLayup: playerData.attributes?.drivingLayup || 25,
              drivingDunk: playerData.attributes?.drivingDunk || 25,
              standingDunk: playerData.attributes?.standingDunk || 25,
              postControl: playerData.attributes?.postControl || 25,
              midRangeShot: playerData.attributes?.midRangeShot || 25,
              threePointShot: playerData.attributes?.threePointShot || 25,
              freeThrow: playerData.attributes?.freeThrow || 25,
              passingAccuracy: playerData.attributes?.passingAccuracy || 25,
              ballHandle: playerData.attributes?.ballHandle || 25,
              speedWithBall: playerData.attributes?.speedWithBall || 25,
              interiorDefense: playerData.attributes?.interiorDefense || 25,
              perimeterDefense: playerData.attributes?.perimeterDefense || 25,
              steal: playerData.attributes?.steal || 25,
              block: playerData.attributes?.block || 25,
              offensiveRebounding: playerData.attributes?.offensiveRebounding || 25,
              defensiveRebounding: playerData.attributes?.defensiveRebounding || 25,
              speed: playerData.attributes?.speed || 25,
              agility: playerData.attributes?.agility || 25,
              strength: playerData.attributes?.strength || 25,
              vertical: playerData.attributes?.vertical || 25,
              stamina: playerData.attributes?.stamina || 25,
            },
            bio: playerData.bio || "",
            isAvailable: playerData.isAvailable ?? true,
            price: playerData.price || "",
            currency: playerData.currency || "",
          })
        } catch (err: any) {
          console.error("Failed to fetch player data:", err.response?.data || err.message)
          setError(err.response?.data?.msg || "Failed to load player data.")
          navigate("/dashboard") // Redirect to dashboard on error
        } finally {
          setLoading(false)
        }
      }
      fetchPlayerData()
    } else if (isEditing && (!id || id === "undefined")) {
      setError("Invalid player ID provided.")
      setLoading(false)
      navigate("/dashboard")
    }
  }, [id, isEditing, authLoading, navigate])

  const positions = [
    { value: "Point Guard", label: "Point Guard" },
    { value: "Shooting Guard", label: "Shooting Guard" },
    { value: "Small Forward", label: "Small Forward" },
    { value: "Power Forward", label: "Power Forward" },
    { value: "Center", label: "Center" },
  ]

  const consoles = ["PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series S", "Xbox Series X"]

  const timezones = ["AEST", "CET", "CST", "EST", "GMT", "JST", "MST", "PST"]

  const badgeLevels = ["Bronze", "Silver", "Gold", "Hall of Fame", "Legend"]

  const availableBadges = [
  "Deadeye",
  "Limitless Range",
  "Mini Marksman",
  "Set Shot Specialist",
  "Shifty Shooter",
  "Aerial Wizard",
  "Float Game",
  "Hook Specialist",
  "Layup Mixmaster",
  "Paint Prodigy",
  "Physical Finisher",
  "Post Fade Phenom",
  "Post Powerhouse",
  "Post Up Poet",
  "Posterizer",
  "Rise Up",
  "Ankle Assassin",
  "Bail Out",
  "Break Starter",
  "Dimer",
  "Handles for Days",
  "Lightning Launch",
  "Strong Handle",
  "Unpluckable",
  "Versatile Visionary",
  "Challenger",
  "Glove",
  "Interceptor",
  "High Flying Denier",
  "Immovable Enforcer",
  "Off Ball Pest",
  "On-Ball Menace",
  "Paint Patroller",
  "Pick Dodger",
  "Post Lockdown",
  "Boxout Beast",
  "Rebound Chaser",
  "Brick Wall",
  "Slippery Off Ball",
  "Pogo Stick"
]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAttributeChange = (attribute: string, value: number | string) => {
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attribute]: value,
      },
    }))
  }

  const handleBadgeToggle = (badgeName: string) => {
    setFormData((prev) => ({
      ...prev,
      badges: prev.badges.some((b) => b.name === badgeName)
        ? prev.badges.filter((b) => b.name !== badgeName)
        : [...prev.badges, { name: badgeName, level: "Bronze" }],
    }))
  }

  const handleBadgeLevelChange = (badgeName: string, level: string) => {
    setFormData((prev) => ({
      ...prev,
      badges: prev.badges.map((badge) => (badge.name === badgeName ? { ...badge, level } : badge)),
    }))
  }

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Validate file is an image and not too large
        if (!file.type.startsWith("image/")) {
          alert("Please select an image file")
          return
        }
        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          alert("Image size should be less than 5MB")
          return
        }

        setScreenshot(file)
        setIsScreenshotChanged(true)

        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        if (screenshotPreviewUrl) {
          URL.revokeObjectURL(screenshotPreviewUrl)
        }
        setScreenshotPreviewUrl(previewUrl)
      } catch (error) {
        console.error("Error handling screenshot:", error)
        alert("Failed to process image. Please try again.")
      }
    }
  }

  const removeScreenshot = () => {
    if (screenshotPreviewUrl) {
      URL.revokeObjectURL(screenshotPreviewUrl)
    }
    setScreenshot(null)
    setScreenshotPreviewUrl(null)
  }

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (screenshotPreviewUrl) {
        URL.revokeObjectURL(screenshotPreviewUrl)
      }
    }
  }, [])

  const uploadToCloudinary = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "PlayersAssets")

      const { data } = await axios.post("https://api.cloudinary.com/v1_1/dtoc87ufk/image/upload", formData)

      if (data.secure_url) {
        return data.secure_url
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error)
      throw error
    }
  }

  const handlePlayerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Validate file is an image and not too large
        if (!file.type.startsWith("image/")) {
          alert("Please select an image file")
          return
        }
        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          alert("Image size should be less than 5MB")
          return
        }

        setPlayerPhoto(file)
        setIsPhotoChanged(true)

        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        if (existingPhotoUrl) {
          URL.revokeObjectURL(existingPhotoUrl)
        }
        setExistingPhotoUrl(previewUrl)
      } catch (error) {
        console.error("Error handling player photo:", error)
        alert("Failed to process image. Please try again.")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required files for new player
    if (!isEditing && (!playerPhoto || !screenshot)) {
      alert("Please upload both player photo and screenshot.")
      return
    }

    setLoading(true)
    setError(null)

    if (!isAuthenticated || !user) {
      setError("You must be logged in to perform this action.")
      setLoading(false)
      return
    }

    try {
      let playerPhotoUrl = existingPhotoUrl || ""
      let screenshotUrl = existingScreenshotUrl || ""

      // Only upload new photo if it's changed or new player
      if (playerPhoto && (isPhotoChanged || !isEditing)) {
        try {
          playerPhotoUrl = await uploadToCloudinary(playerPhoto)
        } catch (error) {
          setError("Failed to upload player photo. Please try again.")
          setLoading(false)
          return
        }
      }
      console.log(playerPhotoUrl, screenshotUrl)
      // Only upload new screenshot if it's changed or new player
      if (screenshot && (isScreenshotChanged || !isEditing)) {
        try {
          screenshotUrl = await uploadToCloudinary(screenshot)
        } catch (error) {
          setError("Failed to upload screenshot. Please try again.")
          setLoading(false)
          return
        }
      }

      // Prepare the data for the API
      const playerData: any = {
        ...formData,
        owner: user.id,
        photoUrl: playerPhotoUrl,
        screenshotUrl: screenshotUrl,
      }

      playerData.console1 = formData.console // Use console from formData
      // Add old URLs for cleanup if they were replaced
      if (isEditing && id) {
        console.log("Editing existing player:", id)
        if (isPhotoChanged && existingPhotoUrl) {
          playerData.oldPhotoUrl = existingPhotoUrl
        }
        if (isScreenshotChanged && existingScreenshotUrl) {
          playerData.oldScreenshotUrl = existingScreenshotUrl
        }

        await API.put(`/players/${id}`, { playerData })
        alert("Player updated successfully!")
      } else {
        await API.post("/players", { playerData })
        alert("Player created successfully!")
      }
      navigate("/dashboard")
    } catch (err: any) {
      console.error("Error saving player:", err.response?.data || err.message)
      alert(err.response?.data?.msg || "Failed to save player. Please try again.")
      setError(err.response?.data?.msg || "Failed to save player. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation">
              <ArrowLeft size={20} className="sm:w-5 sm:h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isEditing ? "Edit Player" : "Add New Player"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {isEditing ? "Update your player information" : "Create a new player profile to find teammates"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="sm:col-span-2 md:col-span-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Player Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base sm:text-sm"
                  placeholder="Enter player name"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  id="position"
                  name="position"
                  required
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base sm:text-sm"
                >
                  <option value="">Select position</option>
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label htmlFor="console" className="block text-sm font-medium text-gray-700 mb-2">
                  Console
                </label>
                <select
                  id="console"
                  name="console"
                  required
                  value={formData.console}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base sm:text-sm"
                >
                  <option value="">Select console</option>
                  {consoles.map((console) => (
                    <option key={console} value={console}>
                      {console}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  required
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base sm:text-sm"
                >
                  <option value="">Select timezone</option>
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Overall Rating: {formData.rating}</label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="60"
                  max="99"
                  value={formData.rating}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rating: Number.parseInt(e.target.value) }))}
                  className="flex-1 h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                />
                <div className="flex items-center space-x-1 min-w-[60px]">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-medium text-gray-900 text-lg sm:text-base">{formData.rating}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base sm:text-sm resize-none"
                placeholder="Tell us about your playstyle, availability, and what you're looking for in teammates."
              />
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Availability (e.g., "4", "10")
                </label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
                  placeholder="e.g., 2.5"
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Unit (e.g., "hrs/week", "per game")
                </label>
                <input
                  type="text"
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
                  placeholder="e.g., hrs/week"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Attributes</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Body Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                    <select
                      value={formData.attributes.height}
                      onChange={(e) => handleAttributeChange("height", e.target.value)}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
                    >
                      {Array.from({ length: 20 }, (_, i) => {
                        const feet = Math.floor((5 * 12 + 8 + i) / 12)
                        const inches = (5 * 12 + 8 + i) % 12
                        const heightStr = `${feet}'${inches}"`
                        return (
                          <option key={heightStr} value={heightStr}>
                            {heightStr}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                    <select
                      value={formData.attributes.weight}
                      onChange={(e) => handleAttributeChange("weight", e.target.value)}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
                    >
                      {Array.from({ length: 41 }, (_, i) => {
                        const weight = 160 + i * 5
                        return (
                          <option key={weight} value={`${weight} lbs`}>
                            {weight} lbs
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wingspan</label>
                    <select
                      value={formData.attributes.wingspan}
                      onChange={(e) => handleAttributeChange("wingspan", e.target.value)}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
                    >
                      {Array.from({ length: 25 }, (_, i) => {
                        const feet = Math.floor((5 * 12 + 8 + i) / 12)
                        const inches = (5 * 12 + 8 + i) % 12
                        const wingspanStr = `${feet}'${inches}"`
                        return (
                          <option key={wingspanStr} value={wingspanStr}>
                            {wingspanStr}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">
                  Finishing (Inside Scoring)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {[
                    { key: "closeShot", label: "Close Shot" },
                    { key: "drivingLayup", label: "Driving Layup" },
                    { key: "drivingDunk", label: "Driving Dunk" },
                    { key: "standingDunk", label: "Standing Dunk" },
                    { key: "postControl", label: "Post Control" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {label}:{" "}
                        <span className="font-semibold text-blue-600">
                          {formData.attributes[key as keyof typeof formData.attributes]}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="25"
                        max="99"
                        value={formData.attributes[key as keyof typeof formData.attributes] as number}
                        onChange={(e) => handleAttributeChange(key, Number.parseInt(e.target.value))}
                        className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">
                  Shooting (Outside Scoring)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {[
                    { key: "midRangeShot", label: "Mid-Range Shot" },
                    { key: "threePointShot", label: "Three-Point Shot" },
                    { key: "freeThrow", label: "Free Throw" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {label}:{" "}
                        <span className="font-semibold text-blue-600">
                          {formData.attributes[key as keyof typeof formData.attributes]}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="25"
                        max="99"
                        value={formData.attributes[key as keyof typeof formData.attributes] as number}
                        onChange={(e) => handleAttributeChange(key, Number.parseInt(e.target.value))}
                        className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">Playmaking</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {[
                    { key: "passingAccuracy", label: "Passing Accuracy" },
                    { key: "ballHandle", label: "Ball Handle" },
                    { key: "speedWithBall", label: "Speed With Ball" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {label}:{" "}
                        <span className="font-semibold text-blue-600">
                          {formData.attributes[key as keyof typeof formData.attributes]}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="25"
                        max="99"
                        value={formData.attributes[key as keyof typeof formData.attributes] as number}
                        onChange={(e) => handleAttributeChange(key, Number.parseInt(e.target.value))}
                        className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">Defense</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {[
                    { key: "interiorDefense", label: "Interior Defense" },
                    { key: "perimeterDefense", label: "Perimeter Defense" },
                    { key: "steal", label: "Steal" },
                    { key: "block", label: "Block" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {label}:{" "}
                        <span className="font-semibold text-blue-600">
                          {formData.attributes[key as keyof typeof formData.attributes]}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="25"
                        max="99"
                        value={formData.attributes[key as keyof typeof formData.attributes] as number}
                        onChange={(e) => handleAttributeChange(key, Number.parseInt(e.target.value))}
                        className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">Rebounding</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {[
                    { key: "offensiveRebounding", label: "Offensive Rebounding" },
                    { key: "defensiveRebounding", label: "Defensive Rebounding" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {label}:{" "}
                        <span className="font-semibold text-blue-600">
                          {formData.attributes[key as keyof typeof formData.attributes]}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="25"
                        max="99"
                        value={formData.attributes[key as keyof typeof formData.attributes] as number}
                        onChange={(e) => handleAttributeChange(key, Number.parseInt(e.target.value))}
                        className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">Physicals</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {[
                    { key: "speed", label: "Speed" },
                    { key: "agility", label: "Agility" },
                    { key: "strength", label: "Strength" },
                    { key: "vertical", label: "Vertical" },
                    { key: "stamina", label: "Stamina" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {label}:{" "}
                        <span className="font-semibold text-blue-600">
                          {formData.attributes[key as keyof typeof formData.attributes]}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="25"
                        max="99"
                        value={formData.attributes[key as keyof typeof formData.attributes] as number}
                        onChange={(e) => handleAttributeChange(key, Number.parseInt(e.target.value))}
                        className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              Badges ({formData.badges.length} selected)
            </h2>

            <div className="space-y-6">
              {formData.badges.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Selected Badges</h3>
                  <div className="space-y-3">
                    {formData.badges.map((badge, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 text-sm sm:text-base">{badge.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={badge.level}
                            onChange={(e) => handleBadgeLevelChange(badge.name, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
                          >
                            {badgeLevels.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleBadgeToggle(badge.name)}
                            className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 rounded-md transition-colors touch-manipulation"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Available Badges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                  {availableBadges.map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => handleBadgeToggle(badge)}
                      disabled={formData.badges.some((b) => b.name === badge)}
                      className={`px-3 py-2 text-xs sm:text-sm rounded-lg border transition-all duration-200 touch-manipulation min-h-[44px] ${
                        formData.badges.some((b) => b.name === badge)
                          ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                          : "bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100"
                      }`}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Player Photo</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
              {playerPhoto ? (
                <div className="space-y-4">
                  <img
                    src={playerPhoto ? URL.createObjectURL(playerPhoto) : undefined}
                    alt="Player preview"
                    className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg mx-auto shadow-md"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-green-600 font-medium text-sm sm:text-base break-all">{playerPhoto.name}</p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPlayerPhoto(null)}
                        className="bg-white hover:bg-red-50 text-red-600 min-h-[44px] touch-manipulation"
                      >
                        Remove Photo
                      </Button>
                      <label
                        htmlFor="playerPhoto"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors min-h-[44px] flex items-center justify-center touch-manipulation"
                      >
                        Choose Different Photo
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">Upload a player photo</p>
                    <div className="flex flex-col items-center gap-3">
                      <label
                        htmlFor="playerPhoto"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors min-h-[44px] flex items-center justify-center touch-manipulation text-sm sm:text-base"
                      >
                        Choose Photo
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500">Upload a clear photo of your player</p>
                    </div>
                  </div>
                </div>
              )}
              <input
                type="file"
                id="playerPhoto"
                accept="image/*"
                onChange={handlePlayerPhotoUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-3">
              This photo will appear on your player card and profile page
            </p>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              Player Screenshot (Badges, Ratings, etc.)
            </h2>

            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files[0]
                  if (!file?.type.startsWith("image/")) {
                    alert("Please drop an image file")
                    return
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    alert("Image size should be less than 5MB")
                    return
                  }
                  if (screenshotPreviewUrl) {
                    URL.revokeObjectURL(screenshotPreviewUrl)
                  }
                  setScreenshot(file)
                  setScreenshotPreviewUrl(URL.createObjectURL(file))
                }}
              >
                {screenshot ? (
                  <div className="space-y-4">
                    <img
                      src={screenshotPreviewUrl ?? undefined}
                      alt="Screenshot preview"
                      className="w-full max-w-sm sm:max-w-md mx-auto h-48 sm:h-60 object-cover rounded-lg"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-green-600 font-medium text-sm sm:text-base break-all">{screenshot.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={removeScreenshot}
                        className="bg-white hover:bg-red-50 text-red-600 min-h-[44px] touch-manipulation"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">Upload a screenshot</p>
                      <div className="flex flex-col items-center gap-3">
                        <label
                          htmlFor="screenshot"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors min-h-[44px] flex items-center justify-center touch-manipulation text-sm sm:text-base"
                        >
                          Choose File
                        </label>
                        <input
                          type="file"
                          id="screenshot"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="hidden"
                        />
                        <p className="text-xs sm:text-sm text-gray-500">Upload an image of your badges or ratings</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
            <Link to="/dashboard" className="order-2 sm:order-1">
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px] touch-manipulation bg-transparent">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              loading={loading}
              className="px-6 sm:px-8 order-1 sm:order-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              {isEditing ? "Update Player" : "Create Player"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddPlayerPage
