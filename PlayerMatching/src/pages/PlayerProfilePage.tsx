"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, MessageSquare, Star, Camera, Gamepad2, Clock, Calendar, User, Send, X } from "lucide-react"
import { Link, useParams, useNavigate } from "react-router-dom"
import Button from "../components/Button"
import API from "../api/api"

interface Player {
  id: string
  owner: {
    _id: string
    username: string
    joinDate: string
    totalPlayers: number
    isOnline: boolean
    lastSeen?: string
  }
  name: string
  position: string
  rating: number
  badges: Array<{ name: string; level: string }>
  console: string
  timezone: string
  joinDate: string
  gamesPlayed: number
  winRate: number
  preferredModes: string[]
  photo?: string
  screenshot?: string
  attributes: {
    height: string
    weight: string
    wingspan: string
    closeShot: number
    drivingLayup: number
    drivingDunk: number
    standingDunk: number
    postControl: number
    midRangeShot: number
    threePointShot: number
    freeThrow: number
    passingAccuracy: number
    ballHandle: number
    speedWithBall: number
    interiorDefense: number
    perimeterDefense: number
    steal: number
    block: number
    offensiveRebounding: number
    defensiveRebounding: number
    speed: number
    agility: number
    strength: number
    vertical: number
    stamina: number
  }
  bio: string
  isAvailable: boolean
  price?: string
  currency?: string
}

const PlayerProfilePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState("Want to team up?")
  const [sending, setSending] = useState(false)

  const fetchPlayer = useCallback(async () => {
    if (!id || id === "undefined") {
      console.error("Invalid player ID:", id)
      setError("Invalid player ID provided.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await API.get(`/players/${id}`)
      console.log("Fetched player:", response.data)
      // Map _id to id for Player interface
      const mappedPlayer: Player = {
        ...response.data,
        id: response.data._id,
      }
      setPlayer(mappedPlayer)
    } catch (err: any) {
      console.error("Failed to fetch player profile:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to load player profile.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPlayer()
  }, [fetchPlayer])

  const handleMessage = () => {
    if (!player) {
      console.error("Cannot open message modal: player is null")
      setError("Player data not available.")
      return
    }
    console.log("Opening message modal for player:", player.id, "owner:", player.owner._id)
    setShowMessageModal(true)
  }

  const handleSendMessage = async () => {
    if (!player || !player.owner._id) {
      console.error("Cannot send message: player or owner._id is missing", { player, ownerId: player?.owner._id })
      setError("Cannot send message: player data is incomplete.")
      return
    }
    setSending(true)
    try {
      console.log("Creating conversation with participantId:", player.owner._id)
      const conversationResponse = await API.post("/conversations", { participantId: player.owner._id })
      const conversationId = conversationResponse.data._id
      console.log("Conversation created:", conversationId)

      console.log("Sending message to conversation:", conversationId, "content:", messageText)
      await API.post("/messages", { conversationId, content: messageText })

      console.log("Message sent successfully, navigating to /messages")
      setShowMessageModal(false)
      setMessageText("Want to team up?")
      navigate(`/messages/${player.owner._id}`)
    } catch (err: any) {
      console.error("Failed to send message:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const handleCloseModal = () => {
    console.log("Closing message modal")
    setShowMessageModal(false)
    setMessageText("Want to team up?")
  }

  const handleInvite = () => {
    if (!player) {
      console.error("Cannot invite: player is null")
      return
    }
    console.log("Invite player:", player.id)
    alert(`Invite sent to player ${player.id}`)
  }

  const getBadgeColor = (level: string) => {
    switch (level) {
      case "Bronze":
        return "border-[#CE8946] text-[#CE8946] bg-[#FEF3E8]"
      case "Silver":
        return "bg-gray-100 border-gray-300 text-gray-700"
      case "Gold":
        return "bg-yellow-100 border-yellow-400 text-yellow-800"
      case "Hall of Fame":
        return "bg-purple-100 border-purple-400 text-purple-800"
      case "Legend":
        return "bg-red-100 border-red-400 text-red-800"
      default:
        return "bg-blue-100 border-blue-200 text-blue-800"
    }
  }

  const getAttributeColor = (value: number) => {
    if (typeof value === "string") return "text-gray-700"
    if (value >= 90) return "text-green-600"
    if (value >= 80) return "text-blue-600"
    if (value >= 70) return "text-yellow-600"
    return "text-gray-600"
  }

  const getAttributeWidth = (value: number) => {
    if (typeof value === "string") return "0%"
    return `${value}%`
  }

  const getBadgeLevelPriority = (level: string) => {
    switch (level) {
      case "Legend":
        return 5
      case "Hall of Fame":
        return 4
      case "Gold":
        return 3
      case "Silver":
        return 2
      case "Bronze":
        return 1
      default:
        return 0
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading player profile...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>
  }

  if (!player) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Player not found.</div>
  }

  const sortedBadges = [...player.badges].sort(
    (a, b) => getBadgeLevelPriority(b.level) - getBadgeLevelPriority(a.level),
  )

  const attributeCategories = [
    {
      title: "Body Settings",
      attributes: {
        height: player.attributes.height,
        weight: player.attributes.weight,
        wingspan: player.attributes.wingspan,
      },
    },
    {
      title: "Finishing (Inside Scoring)",
      attributes: {
        "Close Shot": player.attributes.closeShot,
        "Driving Layup": player.attributes.drivingLayup,
        "Driving Dunk": player.attributes.drivingDunk,
        "Standing Dunk": player.attributes.standingDunk,
        "Post Control": player.attributes.postControl,
      },
    },
    {
      title: "Shooting (Outside Scoring)",
      attributes: {
        "Mid-Range Shot": player.attributes.midRangeShot,
        "Three-Point Shot": player.attributes.threePointShot,
        "Free Throw": player.attributes.freeThrow,
      },
    },
    {
      title: "Playmaking",
      attributes: {
        "Passing Accuracy": player.attributes.passingAccuracy,
        "Ball Handle": player.attributes.ballHandle,
        "Speed With Ball": player.attributes.speedWithBall,
      },
    },
    {
      title: "Defense",
      attributes: {
        "Interior Defense": player.attributes.interiorDefense,
        "Perimeter Defense": player.attributes.perimeterDefense,
        Steal: player.attributes.steal,
        Block: player.attributes.block,
      },
    },
    {
      title: "Rebounding",
      attributes: {
        "Offensive Rebounding": player.attributes.offensiveRebounding,
        "Defensive Rebounding": player.attributes.defensiveRebounding,
      },
    },
    {
      title: "Physicals",
      attributes: {
        Speed: player.attributes.speed,
        Agility: player.attributes.agility,
        Strength: player.attributes.strength,
        Vertical: player.attributes.vertical,
        Stamina: player.attributes.stamina,
      },
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/search" className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Player Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center relative">
                    {player.photo ? (
                      <img
                        src={player.photo || "/placeholder.svg"}
                        alt={player.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-gray-600">{player.name.charAt(0)}</span>
                    )}
                    {player.owner.isOnline && (
                      <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{player.name}</h2>
                      <div className="flex items-center space-x-6 mt-3">
                        <span className="text-gray-600">{player.position}</span>
                        <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-full border border-yellow-200">
                          <Star className="w-6 h-6 text-yellow-500 fill-current" />
                          <span className="text-2xl font-bold text-gray-900">{player.rating}</span>
                          <span className="text-sm font-medium text-yellow-700">OVR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {player.bio && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">About</h3>
                      <p className="text-gray-700">{player.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Attributes</h3>
              <div className="space-y-8">
                {attributeCategories.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">{category.title}</h4>
                    <div className="space-y-3">
                      {Object.entries(category.attributes).map(([attribute, value]) => (
                        <div key={attribute}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-700">{attribute}</span>
                            <span className={`font-bold ${getAttributeColor(value as number)}`}>{value}</span>
                          </div>
                          {typeof value === "number" && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  value >= 90
                                    ? "bg-green-500"
                                    : value >= 80
                                      ? "bg-blue-500"
                                      : value >= 70
                                        ? "bg-yellow-500"
                                        : "bg-gray-500"
                                }`}
                                style={{ width: getAttributeWidth(value) }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Badges</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sortedBadges.map((badge, index) => (
                  <div key={index} className={`border rounded-lg p-3 text-center ${getBadgeColor(badge.level)}`}>
                    <span className="font-medium text-sm">{badge.name}</span>
                    <div className="text-xs mt-1 opacity-75">{badge.level}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Player Screenshot</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {player.screenshot ? (
                    <img
                      src={player.screenshot || "/placeholder.svg"}
                      alt="Player Screenshot"
                      className="max-w-full h-auto mx-auto"
                    />
                  ) : (
                    "No screenshot available"
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Owner</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">{player.owner.username.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{player.owner.username}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span
                      className={`w-2 h-2 rounded-full ${player.owner.isOnline ? "bg-green-400" : "bg-gray-400"}`}
                    ></span>
                    <span>{player.owner.isOnline ? "Online" : `Last seen ${player.owner.lastSeen || "N/A"}`}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-3">
                <Button
                  onClick={handleMessage}
                  className="w-full flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md"
                >
                  <MessageSquare size={20} />
                  <span>Message User</span>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Details</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Gamepad2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Console</div>
                    <div className="text-sm text-gray-600">{player.console}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Timezone</div>
                    <div className="text-sm text-gray-600">{player.timezone}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Owner Since</div>
                    <div className="text-sm text-gray-600">{new Date(player.owner.joinDate).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Total Players</div>
                    <div className="text-sm text-gray-600">
                      {player.owner.totalPlayers} player{player.owner.totalPlayers !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferred Modes</h3>
              <div className="space-y-2">
                {player.preferredModes.map((mode, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg px-3 py-2 text-center font-medium text-gray-700">
                    {mode}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-slideDown">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">{player.owner.username.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Message {player.owner.username}</h3>
                  <p className="text-sm text-gray-500">About {player.name}</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleCloseModal} disabled={sending}>
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                loading={sending}
                disabled={!messageText.trim()}
                className="flex items-center space-x-2"
              >
                <Send size={16} />
                <span>Send Message</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerProfilePage
