"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, MessageSquare, Users, Settings } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import Button from "../components/Button"
import PlayerCard from "../components/PlayerCard"
import API from "../api/api"
import { useAuth } from "../context/AuthContext"

interface Player {
  id: string
  owner?: {
    username: string
    isOnline: boolean
  }
  name: string
  position: string
  rating: number
  badges: Array<{ name: string; level: string }> | string[]
  console: string
  timezone: string
  avatar?: string
  photo?: string
  price?: string
  currency?: string
}

interface Message {
  id: string
  sender: {
    username: string
    photo?: string // Keep optional to match Player interface
  }
  content: string
  timestamp: string
  unread?: boolean
}

interface Conversation {
  id: string
  participants: string[]
  lastMessage?: string
}

const DashboardPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [myPlayers, setMyPlayers] = useState<Player[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchMyPlayers = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoadingPlayers(false)
      return
    }
    setLoadingPlayers(true)
    setError(null)
    try {
      const response = await API.get(`/players?owner=${user.id}`)
      console.log("Fetched players:", response.data)
      const mappedPlayers = response.data
        .map((player: any) => {
          if (!player._id) {
            console.error("Player missing _id:", player)
            return null
          }
          return {
            ...player,
            id: player._id,
          }
        })
        .filter((player: Player | null) => player !== null) as Player[]
      console.log("Mapped players:", mappedPlayers)
      setMyPlayers(mappedPlayers)
    } catch (err: any) {
      console.error("Failed to fetch players:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to load your players.")
    } finally {
      setLoadingPlayers(false)
    }
  }, [isAuthenticated, user])

  const fetchMessages = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoadingMessages(false)
      return
    }
    setLoadingMessages(true)
    setError(null)
    try {
      const convResponse = await API.get(`/conversations?participant=${user.id}`)
      const conversations: Conversation[] = convResponse.data.map((conv: any) => ({
        id: conv._id,
        participants: conv.participants,
        lastMessage: conv.lastMessage,
      }))

      const messagesPromises = conversations.map(async (conv) => {
        if (!conv.lastMessage) return null
        try {
          const messageResponse = await API.get(`/messages/${conv.id}`)
          const messages = messageResponse.data
          const latestMessage = messages[messages.length - 1]
          if (!latestMessage) return null
          // Explicitly type the message to match the Message interface
          const message: Message = {
            id: latestMessage._id,
            sender: {
              username: latestMessage.sender.username,
              photo: latestMessage.sender.photo, // photo is optional
            },
            content: latestMessage.content,
            timestamp: new Date(latestMessage.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unread: latestMessage.sender._id !== user.id,
          }
          return message
        } catch (err: any) {
          console.error(`Failed to fetch messages for conversation ${conv.id}:`, err)
          return null
        }
      })

      const messagesResults = await Promise.all(messagesPromises)
      const validMessages = messagesResults
        .filter((msg): msg is Message => msg !== null) // Type predicate ensures non-null is Message
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3)
      setMessages(validMessages)
    } catch (err: any) {
      console.error("Failed to fetch conversations:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to load messages.")
    } finally {
      setLoadingMessages(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!authLoading) {
      fetchMyPlayers()
      fetchMessages()
    }
  }, [authLoading, fetchMyPlayers, fetchMessages])

  const handleEditPlayer = (playerId: string) => {
    console.log("handleEditPlayer called with playerId:", playerId)
    if (!playerId || playerId === "undefined") {
      console.error("Invalid playerId:", playerId)
      setError("Cannot edit player: Invalid ID")
      return
    }
    navigate(`/edit-player/${playerId}`)
  }

  const handleDeletePlayer = async (playerId: string) => {
    console.log("handleDeletePlayer called with playerId:", playerId)
    if (!playerId || playerId === "undefined") {
      console.error("Invalid playerId:", playerId)
      setError("Cannot delete player: Invalid ID")
      return
    }
    if (window.confirm("Are you sure you want to delete this player profile?")) {
      try {
        await API.delete(`/players/${playerId}`)
        alert("Player deleted successfully!")
        fetchMyPlayers()
      } catch (err: any) {
        console.error("Failed to delete player:", err.response?.data || err.message)
        setError(err.response?.data?.msg || "Failed to delete player.")
      }
    }
  }

  const handleMessageClick = (messageId: string) => {
    navigate("/messages")
  }

  if (authLoading) {
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
          <p className="text-lg sm:text-xl">Please log in to view your dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                Hi, {user?.username || "User"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Ready to dominate the court today?</p>
            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Online</span>
              </div>
              <Link to="/add-player">
                <Button className="flex items-center space-x-2 min-h-[44px] px-4 sm:px-6 touch-manipulation">
                  <Plus size={18} />
                  <span className="hidden xs:inline sm:inline">Add Player</span>
                  <span className="xs:hidden sm:hidden">Add</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Players Section */}
          <div className="xl:col-span-2 space-y-6 sm:space-y-8">
            <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Users size={20} className="sm:w-6 sm:h-6" />
                  <span>My Players</span>
                </h2>
                <Link to="/add-player" className="hidden sm:block">
                  <Button size="sm" className="flex items-center space-x-2 min-h-[40px] touch-manipulation">
                    <Plus size={16} />
                    <span>Add Player</span>
                  </Button>
                </Link>
              </div>

              {loadingPlayers ? (
                <div className="text-center text-gray-500 py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading players...</p>
                </div>
              ) : error ? (
                <div className="text-center text-red-600 py-8 sm:py-12">
                  <p className="text-sm sm:text-base">{error}</p>
                </div>
              ) : myPlayers.length === 0 ? (
                <div className="text-center text-gray-500 py-12 sm:py-16">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-base sm:text-lg mb-2">No players yet</p>
                  <p className="text-sm text-gray-400 mb-6">Create your first player profile to get started</p>
                  <Link to="/add-player">
                    <Button className="min-h-[44px] px-6 touch-manipulation">
                      <Plus size={18} className="mr-2" />
                      Add Your First Player
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {myPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      showActions={false}
                      showEditActions={true}
                      compact={true}
                      onEdit={handleEditPlayer}
                      onDelete={handleDeletePlayer}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Messages Section */}
            <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <MessageSquare size={18} className="sm:w-5 sm:h-5" />
                  <span>Messages</span>
                </h3>
                {messages.filter((m) => m.unread).length > 0 && (
                  <span className="bg-blue-600 text-white text-xs sm:text-sm px-2 py-1 rounded-full min-w-[24px] text-center">
                    {messages.filter((m) => m.unread).length}
                  </span>
                )}
              </div>

              {loadingMessages ? (
                <div className="text-center text-gray-500 py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm">Loading messages...</p>
                </div>
              ) : error ? (
                <div className="text-center text-red-600 py-6">
                  <p className="text-sm">{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm sm:text-base">No messages yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Start connecting with other players</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => handleMessageClick(message.id)}
                      className="flex items-center space-x-3 p-3 sm:p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors touch-manipulation"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        {message.sender.photo ? (
                          <img
                            src={message.sender.photo || "/placeholder.svg"}
                            alt={message.sender.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm sm:text-base font-medium text-gray-600">
                            {message.sender.username.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                            {message.sender.username}
                          </p>
                          {message.unread && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{message.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{message.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-100">
                <Link to="/messages">
                  <Button variant="outline" size="sm" className="w-full bg-transparent min-h-[44px] touch-manipulation">
                    View All Messages
                  </Button>
                </Link>
              </div>
            </section>

            {/* Quick Actions Section */}
            <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/search" className="block">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-start bg-transparent min-h-[44px] touch-manipulation"
                  >
                    <Users size={16} className="mr-3 flex-shrink-0" />
                    <span>Find Players</span>
                  </Button>
                </Link>
                <Link to="/add-player" className="block">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-start bg-transparent min-h-[44px] touch-manipulation"
                  >
                    <Plus size={16} className="mr-3 flex-shrink-0" />
                    <span>Add Player</span>
                  </Button>
                </Link>
                <Link to="/settings" className="block">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-start bg-transparent min-h-[44px] touch-manipulation"
                  >
                    <Settings size={16} className="mr-3 flex-shrink-0" />
                    <span>Settings</span>
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* Mobile FAB */}
        <Link
          to="/add-player"
          className="fixed bottom-6 right-6 xl:hidden w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 z-10 touch-manipulation"
          aria-label="Add Player"
        >
          <Plus size={24} className="sm:w-7 sm:h-7" />
        </Link>
      </div>
    </div>
  )
}

export default DashboardPage
