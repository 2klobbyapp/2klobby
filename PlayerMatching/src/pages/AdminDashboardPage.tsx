"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import API from "../api/api"
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  Trash2,
  Ban,
  Shield,
  AlertTriangle,
  X,
  Search,
  Gamepad2,
  Star,
  Clock,
  DollarSign,
  Eye,
  MessageSquare,
} from "lucide-react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { Line, Pie, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

interface User {
  _id: string
  username: string
  email: string
  joinDate: string
  isAdmin: boolean
  isBanned: boolean
  banReason?: string
}

interface Player {
  _id: string
  owner: {
    _id: string
    username: string
    joinDate: string
    totalPlayers: number
    isOnline: boolean
    lastSeen: string
  }
  name: string
  position: string
  rating: number
  badges: Array<{ name: string; icon?: string }>
  console: string
  timezone: string
  attributes: Record<string, any>
  bio: string
  isAvailable: boolean
  price: number
  currency: string
  photo: string
  screenshot: string
  createdAt: string
  updatedAt: string
}

interface SystemStats {
  totalUsers: number
  totalPlayers: number
  bannedUsers: number
  onlineUsers: number
}

interface PlayerStats {
  totalPlayers: number
  availablePlayers: number
  averageRating: number
  onlinePlayers: number
}

interface Message {
  _id: string
  conversation: string
  sender: { _id: string; username: string; avatar?: string }
  content: string
  timestamp: string
}

interface Conversation {
  _id: string
  participants: Array<{ _id: string; username: string; isOnline: boolean; lastSeen: string; avatar?: string }>
  lastMessage?: { _id: string; content: string; timestamp: string }
  updatedAt: string
}

interface ChatAnalytics {
  messagesPerDay: { date: string; count: number }[]
  newUsersPerDay: { date: string; count: number }[]
  conversationStatus: { active: number; inactive: number }
  userStatus: { active: number; banned: number }
  topPositions: { position: string; count: number }[]
  topSenders: { username: string; count: number }[]
  avgMessageLength: number
  avgParticipantsPerConversation: number
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Tab state
  const [activeTab, setActiveTab] = useState<"users" | "players" | "analytics">("users")
  const [analyticsTab, setAnalyticsTab] = useState<"users" | "players" | "messages" | "conversations">("users")

  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [banReason, setBanReason] = useState("")

  // Players state
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)

  // Analytics state
  const [chatAnalytics, setChatAnalytics] = useState<ChatAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<7 | 14 | 30 | 90>(7)

  // Common state
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // User filters
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "banned">("all")

  // Player filters
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [consoleFilter, setConsoleFilter] = useState<string>("all")
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all")

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [usersRes, statsRes, playersRes] = await Promise.all([
          API.get("admin/users"),
          API.get("admin/stats"),
          API.get("players"),
        ])

        setUsers(usersRes.data || [])
        setFilteredUsers(usersRes.data || [])
        setStats(statsRes.data || null)

        setPlayers(playersRes.data || [])
        setFilteredPlayers(playersRes.data || [])

        const totalPlayers = playersRes.data.length
        const availablePlayers = playersRes.data.filter((p: Player) => p.isAvailable).length
        const averageRating =
          totalPlayers > 0 ? playersRes.data.reduce((sum: number, p: Player) => sum + p.rating, 0) / totalPlayers : 0
        const onlinePlayers = playersRes.data.filter((p: Player) => p.owner.isOnline).length

        setPlayerStats({
          totalPlayers,
          availablePlayers,
          averageRating: Number(averageRating.toFixed(2)),
          onlinePlayers,
        })
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, navigate])

  // Fetch analytics data
  useEffect(() => {
    if (!user?.isAdmin || activeTab !== "analytics") return

    const fetchAnalyticsData = async () => {
      try {
        setAnalyticsLoading(true)
        const [conversationsRes, usersRes, playersRes] = await Promise.all([
          API.get("conversations"),
          API.get("admin/users"),
          API.get("players"),
        ])

        const conversations: Conversation[] = conversationsRes.data || []
        const users: User[] = usersRes.data || []
        const players: Player[] = playersRes.data || []

        // Fetch messages for all conversations
        const messagesPromises = conversations.map((conv) =>
          API.get(`messages/${conv._id}`).then((res) => res.data as Message[])
        )
        const messagesArrays = await Promise.all(messagesPromises)
        const messages = messagesArrays.flat()

        // Time range calculations
        const today = new Date()
        const rangeStart = new Date(today.getTime() - timeRange * 24 * 60 * 60 * 1000)
        const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000)

        // Messages per day
        const messagesPerDay: { date: string; count: number }[] = []
        for (let i = 0; i < timeRange; i++) {
          const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
          const dateStr = date.toISOString().split("T")[0]
          const count = messages.filter(
            (m) => new Date(m.timestamp).toISOString().split("T")[0] === dateStr
          ).length
          messagesPerDay.push({ date: dateStr, count })
        }

        // New users per day
        const newUsersPerDay: { date: string; count: number }[] = []
        for (let i = 0; i < timeRange; i++) {
          const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
          const dateStr = date.toISOString().split("T")[0]
          const count = users.filter(
            (u) => new Date(u.joinDate).toISOString().split("T")[0] === dateStr
          ).length
          newUsersPerDay.push({ date: dateStr, count })
        }

        // Conversation status
        const activeConversations = conversations.filter((conv) =>
          conv.lastMessage ? new Date(conv.lastMessage.timestamp) > oneDayAgo : false
        ).length
        const inactiveConversations = conversations.length - activeConversations

        // User status
        const activeUsers = users.filter((u) => !u.isBanned).length
        const bannedUsers = users.filter((u) => u.isBanned).length

        // Top player positions
        const positionCounts = players.reduce((acc, p) => {
          acc[p.position] = (acc[p.position] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        const topPositions = Object.entries(positionCounts)
          .map(([position, count]) => ({ position, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // Top message senders
        const senderCounts = messages.reduce((acc, m) => {
          const username = m.sender.username
          acc[username] = (acc[username] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        const topSenders = Object.entries(senderCounts)
          .map(([username, count]) => ({ username, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // Average message length
        const avgMessageLength =
          messages.length > 0
            ? messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length
            : 0

        // Average participants per conversation
        const avgParticipantsPerConversation =
          conversations.length > 0
            ? conversations.reduce((sum, c) => sum + c.participants.length, 0) / conversations.length
            : 0

        setChatAnalytics({
          messagesPerDay: messagesPerDay.reverse(),
          newUsersPerDay: newUsersPerDay.reverse(),
          conversationStatus: { active: activeConversations, inactive: inactiveConversations },
          userStatus: { active: activeUsers, banned: bannedUsers },
          topPositions,
          topSenders,
          avgMessageLength: Number(avgMessageLength.toFixed(2)),
          avgParticipantsPerConversation: Number(avgParticipantsPerConversation.toFixed(2)),
        })
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch analytics data")
      } finally {
        setAnalyticsLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [user, activeTab, timeRange])

  // Filter users
  useEffect(() => {
    let filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (userStatusFilter === "active") {
      filtered = filtered.filter((user) => !user.isBanned)
    } else if (userStatusFilter === "banned") {
      filtered = filtered.filter((user) => user.isBanned)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, userStatusFilter])

  // Filter players
  useEffect(() => {
    let filtered = players.filter(
      (player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.owner.username.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (positionFilter !== "all") {
      filtered = filtered.filter((player) => player.position === positionFilter)
    }

    if (consoleFilter !== "all") {
      filtered = filtered.filter((player) => player.console === consoleFilter)
    }

    if (availabilityFilter === "available") {
      filtered = filtered.filter((player) => player.isAvailable)
    } else if (availabilityFilter === "unavailable") {
      filtered = filtered.filter((player) => !player.isAvailable)
    }

    setFilteredPlayers(filtered)
  }, [players, searchTerm, positionFilter, consoleFilter, availabilityFilter])

  // User management functions
  const handleBanUser = async (userId: string) => {
    if (!banReason.trim()) return

    try {
      await API.post(`/admin/users/${userId}/ban`, { reason: banReason })
      setUsers(users.map((u) => (u._id === userId ? { ...u, isBanned: true, banReason } : u)))
      setBanReason("")
      setSelectedUser(null)
      setError("")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to ban user")
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      await API.post(`/admin/users/${userId}/unban`)
      setUsers(users.map((u) => (u._id === userId ? { ...u, isBanned: false, banReason: undefined } : u)))
      setError("")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to unban user")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    console.log("Deleting user:", userId);
    
    try {
      await API.delete(`/admin/users/${userId}`)
      setUsers(users.filter((u) => u._id !== userId))
      setUserToDelete(null)
      setError("")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user")
    }
  }

  // Player management functions
  const handleDeletePlayer = async (playerId: string) => {
    try {
      await API.delete(`/players/${playerId}`)
      setPlayers(players.filter((p) => p._id !== playerId))
      setPlayerToDelete(null)
      setError("")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete player")
    }
  }

  const clearError = () => setError("")

  // Get unique values for filters
  const uniquePositions = [...new Set(players.map((p) => p.position))]
  const uniqueConsoles = [...new Set(players.map((p) => p.console))]

  // Chart data
  const messagesLineChartData = {
    labels: chatAnalytics?.messagesPerDay.map((d) => d.date) || [],
    datasets: [
      {
        label: "Messages Sent",
        data: chatAnalytics?.messagesPerDay.map((d) => d.count) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const newUsersLineChartData = {
    labels: chatAnalytics?.newUsersPerDay.map((d) => d.date) || [],
    datasets: [
      {
        label: "New Users",
        data: chatAnalytics?.newUsersPerDay.map((d) => d.count) || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const userStatusPieChartData = {
    labels: ["Active Users", "Banned Users"],
    datasets: [
      {
        data: chatAnalytics ? [chatAnalytics.userStatus.active, chatAnalytics.userStatus.banned] : [0, 0],
        backgroundColor: ["rgb(34, 197, 94)", "rgb(239, 68, 68)"],
        borderColor: ["rgb(255, 255, 255)"],
        borderWidth: 2,
      },
    ],
  }

  const conversationStatusPieChartData = {
    labels: ["Active Conversations", "Inactive Conversations"],
    datasets: [
      {
        data: chatAnalytics
          ? [chatAnalytics.conversationStatus.active, chatAnalytics.conversationStatus.inactive]
          : [0, 0],
        backgroundColor: ["rgb(59, 130, 246)", "rgb(107, 114, 128)"],
        borderColor: ["rgb(255, 255, 255)"],
        borderWidth: 2,
      },
    ],
  }

  const topPositionsBarChartData = {
    labels: chatAnalytics?.topPositions.map((p) => p.position) || [],
    datasets: [
      {
        label: "Player Count by Position",
        data: chatAnalytics?.topPositions.map((p) => p.count) || [],
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  }

  const topSendersBarChartData = {
    labels: chatAnalytics?.topSenders.map((s) => s.username) || [],
    datasets: [
      {
        label: "Messages Sent by User",
        data: chatAnalytics?.topSenders.map((s) => s.count) || [],
        backgroundColor: "rgba(34, 197, 94, 0.6)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || ""
            const value = context.parsed.y || context.parsed
            return `${label}: ${value}`
          },
        },
      },
    },
  }

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Count",
        },
      },
    },
  }

  // Animation variants with explicit typing
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: "easeOut" as const // Explicitly type as const to match Easing
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { 
        duration: 0.3 
      } 
    },
  }

  const buttonVariants: Variants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  }

  if (!user?.isAdmin) {
    return null
  }

  if (loading && activeTab !== "analytics") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3"
      >
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}

      {/* Main Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {["users", "players", "analytics"].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab as "users" | "players" | "analytics")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <div className="flex items-center gap-2">
                {tab === "users" && <Users className="h-4 w-4" />}
                {tab === "players" && <Gamepad2 className="h-4 w-4" />}
                {tab === "analytics" && <MessageSquare className="h-4 w-4" />}
                {tab === "users" && "Users Management"}
                {tab === "players" && "Players Management"}
                {tab === "analytics" && "Analytics Dashboard"}
              </div>
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Users Tab */}
      <AnimatePresence>
        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* System Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
                  { label: "Total Players", value: stats.totalPlayers, icon: UserCheck, color: "text-green-500" },
                  { label: "Banned Users", value: stats.bannedUsers, icon: UserX, color: "text-red-500" },
                  { label: "Online Users", value: stats.onlineUsers, icon: Activity, color: "text-purple-500" },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Users Filters and Search */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                    />
                  </div>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as "all" | "active" | "banned")}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active Only</option>
                    <option value="banned">Banned Only</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Users Table */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Join Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <motion.tr
                        key={user._id}
                        className="hover:bg-gray-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              {user.banReason && <div className="text-xs text-red-600">Reason: {user.banReason}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.joinDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isBanned ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <UserX className="h-3 w-3 mr-1" />
                              Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isAdmin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {user.isBanned ? (
                              <motion.button
                                onClick={() => handleUnbanUser(user._id)}
                                className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Unban
                              </motion.button>
                            ) : (
                              <motion.button
                                onClick={() => setSelectedUser(user)}
                                disabled={user.isAdmin}
                                className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Ban
                              </motion.button>
                            )}
                            <motion.button
                              onClick={() => setUserToDelete(user)}
                              disabled={user.isAdmin}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || userStatusFilter !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "No users have been added yet."}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Players Tab */}
      <AnimatePresence>
        {activeTab === "players" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Player Stats */}
            {playerStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Players", value: playerStats.totalPlayers, icon: Gamepad2, color: "text-blue-500" },
                  {
                    label: "Available Players",
                    value: playerStats.availablePlayers,
                    icon: UserCheck,
                    color: "text-green-500",
                  },
                  { label: "Average Rating", value: playerStats.averageRating, icon: Star, color: "text-yellow-500" },
                  {
                    label: "Online Players",
                    value: playerStats.onlinePlayers,
                    icon: Activity,
                    color: "text-purple-500",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Players Filters and Search */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Player Management</h2>
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search players, positions, or owners..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                    />
                  </div>
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Positions</option>
                    {uniquePositions.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                  <select
                    value={consoleFilter}
                    onChange={(e) => setConsoleFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Consoles</option>
                    {uniqueConsoles.map((console) => (
                      <option key={console} value={console}>
                        {console}
                      </option>
                    ))}
                  </select>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value as "all" | "available" | "unavailable")}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Players</option>
                    <option value="available">Available Only</option>
                    <option value="unavailable">Unavailable Only</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Players Table */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Console
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlayers.map((player) => (
                      <motion.tr
                        key={player._id}
                        className="hover:bg-gray-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {player.photo ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={player.photo || "/placeholder.svg"}
                                  alt={player.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <Gamepad2 className="h-5 w-5 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{player.name}</div>
                              <div className="text-sm text-gray-500">{player.timezone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{player.owner.username}</div>
                          <div className="text-sm text-gray-500">
                            {player.owner.isOnline ? (
                              <span className="text-green-600">Online</span>
                            ) : (
                              <span className="text-gray-500">Offline</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">{player.rating}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.console}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-gray-900">
                              {player.price} {player.currency}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {player.isAvailable ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Unavailable
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <motion.button
                              onClick={() => setSelectedPlayer(player)}
                              className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </motion.button>
                            <motion.button
                              onClick={() => setPlayerToDelete(player)}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredPlayers.length === 0 && (
                <div className="text-center py-12">
                  <Gamepad2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No players found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || positionFilter !== "all" || consoleFilter !== "all" || availabilityFilter !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "No players have been created yet."}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Dashboard Tab */}
      <AnimatePresence>
        {activeTab === "analytics" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              {/* Header and Time Range Filter */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex gap-2"
                >
                  {[7, 14, 30, 90].map((days) => (
                    <motion.button
                      key={days}
                      onClick={() => setTimeRange(days as 7 | 14 | 30 | 90)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        timeRange === days
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      Last {days} Days
                    </motion.button>
                  ))}
                </motion.div>
              </div>

              {/* Analytics Sub-Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                  {[
                    { id: "users", label: "Users", icon: Users },
                    { id: "players", label: "Players", icon: Gamepad2 },
                    { id: "messages", label: "Messages", icon: MessageSquare },
                    { id: "conversations", label: "Conversations", icon: MessageSquare },
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setAnalyticsTab(tab.id as "users" | "players" | "messages" | "conversations")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        analyticsTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <div className="flex items-center gap-2">
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </div>
                    </motion.button>
                  ))}
                </nav>
              </div>

              {/* Analytics Content */}
              {analyticsLoading ? (
                <div className="animate-pulse space-y-8">
                  <div className="h-8 bg-gray-200 rounded w-64"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-64 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                chatAnalytics && (
                  <AnimatePresence mode="wait">
                    {/* Users Sub-Tab */}
                    {analyticsTab === "users" && (
                      <motion.div
                        key="users"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                          >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">User Status</h3>
                            <div className="h-64">
                              <Pie data={userStatusPieChartData} options={chartOptions} />
                            </div>
                          </motion.div>
                          <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                          >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">New Users Over Time</h3>
                            <div className="h-64">
                              <Line data={newUsersLineChartData} options={chartOptions} />
                            </div>
                          </motion.div>
                          <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2"
                          >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">User Metrics</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {(chatAnalytics.userStatus.active + chatAnalytics.userStatus.banned).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Active Users</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {chatAnalytics.userStatus.active.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Banned Users</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {chatAnalytics.userStatus.banned.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {/* Players Sub-Tab */}
                    {analyticsTab === "players" && (
                      <motion.div
                        key="players"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                          >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Player Positions</h3>
                            <div className="h-64">
                              <Bar data={topPositionsBarChartData} options={barChartOptions} />
                            </div>
                          </motion.div>
                          <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                          >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Player Metrics</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Total Players</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {playerStats?.totalPlayers.toLocaleString() || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Available Players</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {playerStats?.availablePlayers.toLocaleString() || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {playerStats?.averageRating.toLocaleString() || 0}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {/* Messages Sub-Tab */}
                    {analyticsTab === "messages" && (
                      <motion.div
                        key="messages"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                          >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Messages Sent Over Time</h3>
                            <div className="h-64">
                              <Line data={messagesLineChartData} options={chartOptions} />
                            </div>
                          </motion.div>
                          <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                          >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Message Senders</h3>
                            <div className="h-64">
                              <Bar data={topSendersBarChartData} options={barChartOptions} />
                            </div>
                          </motion.div>
                          <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2"
                          >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Message Metrics</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Average Message Length</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {chatAnalytics.avgMessageLength.toLocaleString()} characters
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {chatAnalytics.messagesPerDay.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {/* Conversations Sub-Tab */}
                    {analyticsTab === "conversations" && (
                      <motion.div
                        key="conversations"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                          >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation Status</h3>
                            <div className="h-64">
                              <Pie data={conversationStatusPieChartData} options={chartOptions} />
                            </div>
                          </motion.div>
                          <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                          >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation Metrics</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {(chatAnalytics.conversationStatus.active + chatAnalytics.conversationStatus.inactive).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Avg. Participants per Conversation</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {chatAnalytics.avgParticipantsPerConversation.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ban User Modal */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Ban User</h2>
                <p className="text-sm text-gray-500">@{selectedUser.username}</p>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for ban *</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Please provide a detailed reason for banning this user..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <motion.button
                onClick={() => {
                  setSelectedUser(null)
                  setBanReason("")
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={() => handleBanUser(selectedUser._id)}
                disabled={!banReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Ban User
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Delete User</h2>
                <p className="text-sm text-gray-500">@{userToDelete.username}</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this user? This action cannot be undone and will permanently remove all
                user data including their profile, game history, and associated records.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <motion.button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={() => handleDeleteUser(userToDelete._id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Delete User
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Player Details Modal */}
      {selectedPlayer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Player Details</h2>
              <motion.button
                onClick={() => setSelectedPlayer(null)}
                className="text-gray-400 hover:text-gray-600"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <X className="h-6 w-6" />
              </motion.button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedPlayer.photo ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={selectedPlayer.photo || "/placeholder.svg"}
                      alt={selectedPlayer.name}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <Gamepad2 className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedPlayer.name}</h3>
                    <p className="text-sm text-gray-500">{selectedPlayer.position}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900">{selectedPlayer.rating}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Console</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPlayer.console}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{selectedPlayer.timezone}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <div className="flex items-center mt-1">
                      <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-gray-900">
                        {selectedPlayer.price} {selectedPlayer.currency}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPlayer.owner.username}</p>
                  <p className="text-xs text-gray-500">
                    {selectedPlayer.owner.isOnline
                      ? "Online"
                      : `Last seen: ${new Date(selectedPlayer.owner.lastSeen).toLocaleDateString()}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      selectedPlayer.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedPlayer.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {selectedPlayer.screenshot && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot</label>
                    <img
                      className="w-full h-32 object-cover rounded-lg"
                      src={selectedPlayer.screenshot || "/placeholder.svg"}
                      alt="Player screenshot"
                    />
                  </div>
                )}
                {selectedPlayer.bio && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPlayer.bio}</p>
                  </div>
                )}
                {selectedPlayer.badges && selectedPlayer.badges.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Badges</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedPlayer.badges.map((badge, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {badge.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedPlayer.owner.joinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Player Confirmation Modal */}
      {playerToDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Delete Player</h2>
                <p className="text-sm text-gray-500">{playerToDelete.name}</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this player profile? This action cannot be undone and will permanently
                remove the player from the system.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <motion.button
                onClick={() => setPlayerToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={() => handleDeletePlayer(playerToDelete._id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Delete Player
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
