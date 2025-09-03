"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Smile, Paperclip, MoreVertical, ArrowLeft, Users, X, Trash2 } from "lucide-react"
import { Link, useParams, useNavigate, useLocation } from "react-router-dom"
import Button from "../components/Button"
import { io, type Socket } from "socket.io-client"
import API from "../api/api"
import { useAuth } from "../context/AuthContext"

interface Message {
  _id: string
  conversation: string
  sender: {
    _id: string
    username: string
    avatar?: string
  }
  content: string
  timestamp: string
  isOwn?: boolean
  isSending?: boolean // New field for sending state
}

interface Conversation {
  _id: string
  participants: Array<{
    _id: string
    username: string
    isOnline: boolean
    lastSeen?: string
    avatar?: string
  }>
  isGroup?: boolean
  groupName?: string
  groupAdmin?: {
    _id: string
    username: string
    avatar?: string
  }
  groupDescription?: string
  lastMessage?: Message
  createdAt: string
  updatedAt: string
  unread?: boolean
}

interface User {
  _id: string
  username: string
  avatar?: string
  isOnline: boolean
}

interface GroupUsers {
  chatUsers: User[]
  allUsers: User[]
}

interface MessagingPageProps {
  conversation_id?: string
}

const MessagingPage: React.FC<MessagingPageProps> = ({ conversation_id: propConversationId }) => {
  const location = useLocation()
  const stateConversationId = location.state?.conversation_id
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { playerId } = useParams<{ playerId?: string }>()
  const navigate = useNavigate()

  // State variables
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    propConversationId || stateConversationId || null,
  )
  const [newMessageContent, setNewMessageContent] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [startingConversation, setStartingConversation] = useState(false)

  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [groupUsers, setGroupUsers] = useState<GroupUsers>({ chatUsers: [], allUsers: [] })
  const [loadingGroupUsers, setLoadingGroupUsers] = useState(false)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const isTypingSentRef = useRef(false) // New ref to track typing state

  const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace("/api", "") || "http://localhost:5000"

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const fetchGroupUsers = useCallback(async () => {
    if (!isAuthenticated) return
    setLoadingGroupUsers(true)
    try {
      const response = await API.get("/conversations/users")
      setGroupUsers(response.data)
    } catch (err: any) {
      console.error("Failed to fetch users:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to load users.")
    } finally {
      setLoadingGroupUsers(false)
    }
  }, [isAuthenticated])

  const createGroup = useCallback(async () => {
    if (!groupName.trim() || selectedUsers.length < 2 || creatingGroup) return

    setCreatingGroup(true)
    try {
      const response = await API.post("/conversations/group", {
        groupName: groupName.trim(),
        participantIds: selectedUsers,
        groupDescription: groupDescription.trim(),
      })

      const newGroup: Conversation = response.data
      setConversations((prev) =>
        [newGroup, ...prev].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      )

      // Notify via socket
      if (socketRef.current) {
        socketRef.current.emit("group_created", {
          groupId: newGroup._id,
          participants: newGroup.participants.map((p) => p._id),
          groupName: newGroup.groupName,
          creatorName: user?.username,
        })
      }

      // Reset modal state
      setShowGroupModal(false)
      setGroupName("")
      setGroupDescription("")
      setSelectedUsers([])
      setSelectedConversationId(newGroup._id)
      setIsMobileConversationOpen(true)
    } catch (err: any) {
      console.error("Failed to create group:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to create group.")
    } finally {
      setCreatingGroup(false)
    }
  }, [groupName, selectedUsers, groupDescription, creatingGroup, user])

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
        return
      }

      try {
        const groupToDelete = conversations.find((c) => c._id === groupId)
        await API.delete(`/conversations/group/${groupId}`)

        // Notify via socket
        if (socketRef.current && groupToDelete) {
          socketRef.current.emit("group_deleted", {
            groupId,
            participants: groupToDelete.participants.map((p) => p._id),
            groupName: groupToDelete.groupName,
            adminName: user?.username,
          })
        }

        // Remove from conversations list
        setConversations((prev) => prev.filter((c) => c._id !== groupId))

        // If this was the selected conversation, clear selection
        if (selectedConversationId === groupId) {
          setSelectedConversationId(null)
          setIsMobileConversationOpen(false)
        }
      } catch (err: any) {
        console.error("Failed to delete group:", err.response?.data || err.message)
        setError(err.response?.data?.msg || "Failed to delete group.")
      }
    },
    [conversations, selectedConversationId, user],
  )

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const newSocket = io(backendUrl, {
      transports: ["websocket"],
      auth: { token: localStorage.getItem("token") },
    })

    socketRef.current = newSocket

    newSocket.on("connect", () => {
      console.log("Socket.IO connected:", newSocket.id)
      setIsSocketConnected(true)
      newSocket.emit("setup", { id: user.id, userName: user.username })
    })

    newSocket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message)
      setError("Failed to connect to chat server.")
      setIsSocketConnected(false)
    })

    newSocket.on("group_invitation", (data) => {
      console.log("Group invitation received:", data)
      // Refresh conversations to show new group
      fetchConversations()
    })

    newSocket.on("group_deleted", (data) => {
      console.log("Group deleted:", data)
      // Remove group from conversations
      setConversations((prev) => prev.filter((c) => c._id !== data.groupId))
      if (selectedConversationId === data.groupId) {
        setSelectedConversationId(null)
        setIsMobileConversationOpen(false)
      }
    })

    return () => {
      newSocket.disconnect()
      setIsSocketConnected(false)
    }
  }, [isAuthenticated, user, backendUrl])

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return
    setLoadingConversations(true)
    setError(null)
    try {
      const response = await API.get("/conversations")
      const sortedConversations = response.data.sort(
        (a: Conversation, b: Conversation) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      setConversations(sortedConversations)
    } catch (err: any) {
      console.error("Failed to fetch conversations:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to load conversations.")
    } finally {
      setLoadingConversations(false)
    }
  }, [isAuthenticated])

  // Socket event listeners
  useEffect(() => {
    if (!socketRef.current || !isSocketConnected) return

    const socket = socketRef.current

    const handleReceiveMessage = (messageData: {
      messageId: string
      chatId: string
      sender: string
      senderName: string
      pic?: string
      text: string
      timestamp: string
      isGroup?: boolean
      groupName?: string
    }) => {
      if (messageData.chatId !== selectedConversationId || !messageData.messageId) {
        console.log("Ignoring message for non-selected conversation or missing ID:", messageData)
        return
      }

      setMessages((prevMessages) => {
        // Replace temporary message with server-confirmed message
        const updatedMessages = prevMessages.map((msg) =>
          msg.isSending && msg.content === messageData.text && msg.sender._id === messageData.sender
            ? {
              ...msg,
              _id: messageData.messageId,
              timestamp: messageData.timestamp,
              isSending: false,
            }
            : msg,
        )

        // If no temporary message was found, add the new message
        if (!updatedMessages.some((msg) => msg._id === messageData.messageId)) {
          const newMessage: Message = {
            _id: messageData.messageId,
            conversation: messageData.chatId,
            sender: {
              _id: messageData.sender,
              username: messageData.senderName || "Unknown",
              avatar: messageData.pic,
            },
            content: messageData.text,
            timestamp: messageData.timestamp,
            isOwn: messageData.sender === user?.id,
            isSending: false,
          }
          updatedMessages.push(newMessage)
        }

        return updatedMessages
      })

      setConversations((prevConversations) =>
        prevConversations
          .map((conv) =>
            conv._id === messageData.chatId
              ? {
                ...conv,
                lastMessage: {
                  _id: messageData.messageId,
                  conversation: messageData.chatId,
                  sender: {
                    _id: messageData.sender,
                    username: messageData.senderName || "Unknown",
                    avatar: messageData.pic,
                  },
                  content: messageData.text,
                  timestamp: messageData.timestamp,
                },
                updatedAt: messageData.timestamp,
              }
              : conv,
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      )
    }

    const handleTyping = (data: { sender: string; senderName?: string }) => {
      if (data.sender !== user?.id) setIsTyping(true)
    }

    const handleTypingStop = (data: { sender: string; senderName?: string }) => {
      if (data.sender !== user?.id) setIsTyping(false)
    }

    const handleUserStatusUpdate = ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      setConversations((prevConversations) =>
        prevConversations.map((conv) => ({
          ...conv,
          participants: conv.participants.map((p) =>
            p._id === userId ? { ...p, isOnline, lastSeen: isOnline ? undefined : new Date().toISOString() } : p,
          ),
        })),
      )
    }

    socket.on("receive_message", handleReceiveMessage)
    socket.on("typing", handleTyping)
    socket.on("typingStop", handleTypingStop)
    socket.on("userStatusUpdate", handleUserStatusUpdate)

    return () => {
      socket.off("receive_message", handleReceiveMessage)
      socket.off("typing", handleTyping)
      socket.off("typingStop", handleTypingStop)
      socket.off("userStatusUpdate", handleUserStatusUpdate)
    }
  }, [isSocketConnected, selectedConversationId, user])

  // Join/leave conversation room
  useEffect(() => {
    if (!socketRef.current || !isSocketConnected || !selectedConversationId) return

    console.log("Joining room:", selectedConversationId)
    socketRef.current.emit("enterroom", selectedConversationId)

    return () => {
      console.log("Leaving room:", selectedConversationId)
      socketRef.current?.emit("leaveroom", selectedConversationId)
    }
  }, [selectedConversationId, isSocketConnected])

  // Start a new conversation
  const startConversation = useCallback(
    async (targetPlayerId: string) => {
      if (!isAuthenticated || !user || startingConversation) return
      if (!targetPlayerId || targetPlayerId === "undefined") {
        setError("Invalid player ID.")
        navigate("/messages")
        return
      }

      setStartingConversation(true)
      try {
        const existingConversation = conversations.find(
          (conv) => conv.participants.some((p) => p._id === targetPlayerId && p._id !== user.id) && !conv.isGroup,
        )

        if (existingConversation) {
          setSelectedConversationId(existingConversation._id)
          setIsMobileConversationOpen(true)
          return
        }

        const response = await API.post("/conversations", { participantId: targetPlayerId })
        const newConversation: Conversation = response.data
        setConversations((prev) =>
          [newConversation, ...prev].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        )
        setSelectedConversationId(newConversation._id)
        setIsMobileConversationOpen(true)
      } catch (err: any) {
        console.error("Failed to start conversation:", err.response?.data || err.message)
        setError(err.response?.data?.msg || "Failed to start conversation.")
        navigate("/messages")
      } finally {
        setStartingConversation(false)
      }
    },
    [isAuthenticated, user, conversations, navigate, startingConversation],
  )

  // Handle playerId from URL
  useEffect(() => {
    if (playerId && playerId !== "undefined" && !authLoading) {
      console.log("Starting conversation with playerId:", playerId)
      startConversation(playerId)
    }
  }, [playerId, authLoading, startConversation])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated || !conversationId) return
      setLoadingMessages(true)
      setError(null)
      try {
        console.log("Fetching messages for conversation:", conversationId)
        const response = await API.get(`/messages/${conversationId}`)
        setMessages(
          response.data.map((msg: Message) => ({
            ...msg,
            isOwn: msg.sender._id === user?.id,
            isSending: false,
          })),
        )
      } catch (err: any) {
        console.error("Failed to fetch messages:", err.response?.data || err.message)
        setError(err.response?.data?.msg || "Failed to load messages.")
      } finally {
        setLoadingMessages(false)
      }
    },
    [isAuthenticated, user],
  )

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchConversations()
    }
  }, [isAuthenticated, authLoading])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId)
    }
  }, [selectedConversationId, fetchMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle typing indicator with debouncing
  const handleTyping = useCallback(() => {
    if (!socketRef.current || !selectedConversationId || !user) return

    if (!isTypingSentRef.current) {
      isTypingSentRef.current = true
      socketRef.current.emit("typing", {
        chat: { chat: { _id: selectedConversationId } },
        sender: user.id,
        senderName: user.username,
      })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typingStop", {
          chat: { chat: { _id: selectedConversationId } },
          sender: user.id,
          senderName: user.username,
        })
        isTypingSentRef.current = false
      }, 3000)
    }
  }, [selectedConversationId, user])

  // Handle send message with optimistic update
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessageContent.trim() || !selectedConversationId || !user || !isSocketConnected) return

    const tempMessageId = `temp-${Date.now()}` // Temporary ID for optimistic update
    const tempMessage: Message = {
      _id: tempMessageId,
      conversation: selectedConversationId,
      sender: {
        _id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
      content: newMessageContent.trim(),
      timestamp: new Date().toISOString(),
      isOwn: true,
      isSending: true,
    }

    // Optimistically add the message to the UI
    setMessages((prevMessages) => [...prevMessages, tempMessage])
    setNewMessageContent("")
    scrollToBottom()

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      socketRef.current?.emit("typingStop", {
        chat: { chat: { _id: selectedConversationId } },
        sender: user.id,
        senderName: user.username,
      })
      isTypingSentRef.current = false
    }

    try {
      const messageToSend = {
        conversationId: selectedConversationId,
        senderId: user.id,
        content: newMessageContent.trim(),
      }

      const response = await API.post("/messages", messageToSend)
      const newMessage = response.data

      const currentConversation = conversations.find((conv) => conv._id === selectedConversationId)
      if (currentConversation && socketRef.current) {
        socketRef.current.emit("new_message", {
          chat: {
            chat: {
              _id: selectedConversationId,
              users: currentConversation.participants.map((p) => p._id),
            },
          },
          message: newMessageContent.trim(),
          sender: user.id,
          pic: user.avatar,
          senderName: user.username,
          messageId: newMessage._id,
          timestamp: newMessage.timestamp,
        })
      }
    } catch (err: any) {
      console.error("Failed to send message:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to send message.")
      // Remove the temporary message on error
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== tempMessageId))
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const currentConversation = conversations.find((c) => c._id === selectedConversationId)
  const otherParticipant = currentConversation?.participants.find((p) => p._id !== user?.id)

  if (authLoading || loadingConversations) {
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
          <p className="text-lg sm:text-xl">Please log in to view your messages.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Create Group</h2>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName("");
                    setGroupDescription("");
                    setSelectedUsers([]);
                    setSearchQuery(""); // Reset search query
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Members (Select at least 2)</label>
                {/* Search Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full px-3 py-3 sm:py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />

                {loadingGroupUsers ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm">Loading users...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Chat Users Section */}
                    {groupUsers.chatUsers.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Chats</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {groupUsers.chatUsers
                            .filter((chatUser) =>
                              chatUser.username.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((chatUser) => (
                              <label
                                key={chatUser._id}
                                className="flex items-center space-x-3 p-3 sm:p-2 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(chatUser._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsers((prev) => [...prev, chatUser._id]);
                                    } else {
                                      setSelectedUsers((prev) => prev.filter((id) => id !== chatUser._id));
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-medium text-gray-600">
                                      {chatUser.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-sm sm:text-base text-gray-900 truncate">{chatUser.username}</span>
                                  {chatUser.isOnline && (
                                    <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                                  )}
                                </div>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* All Users Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">All Users</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {groupUsers.allUsers
                          .filter(
                            (allUser) =>
                              !groupUsers.chatUsers.some((chatUser) => chatUser._id === allUser._id) &&
                              allUser.username.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((allUser) => (
                            <label
                              key={allUser._id}
                              className="flex items-center space-x-3 p-3 sm:p-2 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(allUser._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers((prev) => [...prev, allUser._id]);
                                  } else {
                                    setSelectedUsers((prev) => prev.filter((id) => id !== allUser._id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-medium text-gray-600">
                                    {allUser.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm sm:text-base text-gray-900 truncate">{allUser.username}</span>
                                {allUser.isOnline && (
                                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Selected: {selectedUsers.length} member{selectedUsers.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 sm:gap-3 sm:space-x-0">
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setGroupName("");
                  setGroupDescription("");
                  setSelectedUsers([]);
                  setSearchQuery(""); // Reset search query
                }}
                className="order-2 sm:order-1 px-4 py-3 sm:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors touch-manipulation"
              >
                Cancel
              </button>
              <Button
                onClick={createGroup}
                disabled={!groupName.trim() || selectedUsers.length < 2 || creatingGroup}
                className="order-1 sm:order-2 px-4 py-3 sm:py-2 disabled:opacity-50 touch-manipulation"
              >
                {creatingGroup ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Conversations Sidebar - Desktop */}
      <div
        className={`hidden lg:flex w-80 xl:w-96 bg-white border-r border-gray-200 flex-col ${isMobileConversationOpen ? "hidden" : ""}`}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Messages</h1>
            <button
              onClick={() => {
                setShowGroupModal(true)
                fetchGroupUsers()
              }}
              className="p-2 sm:p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
              title="Create Group"
              aria-label="Create Group"
            >
              <Users size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
          {!isSocketConnected && (
            <div className="text-sm text-red-500 mt-2 p-2 bg-red-50 rounded-lg">Connecting to chat server...</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && <div className="p-4 text-red-600 bg-red-50 mx-4 mt-4 rounded-lg">{error}</div>}
          {conversations.length === 0 ? (
            <div className="p-6 text-gray-500 text-center">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-base mb-2">No conversations yet</p>
              <p className="text-sm text-gray-400">Start chatting with other players</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const participant = conversation.participants.find((p) => p._id !== user?.id)
              const displayName = conversation.isGroup ? conversation.groupName : participant?.username
              const isGroupAdmin = conversation.isGroup && conversation.groupAdmin?._id === user?.id

              return (
                <div
                  key={conversation._id}
                  className={`relative group p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedConversationId === conversation._id ? "bg-blue-50 border-r-2 border-r-blue-600" : ""
                    }`}
                >
                  <div
                    onClick={() => {
                      setSelectedConversationId(conversation._id)
                      setIsMobileConversationOpen(true)
                    }}
                    className="flex items-center space-x-3"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-full flex items-center justify-center">
                        {conversation.isGroup ? (
                          <Users size={20} className="sm:w-6 sm:h-6 text-gray-600" />
                        ) : (
                          <span className="font-medium text-sm sm:text-base text-gray-600">
                            {participant?.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {!conversation.isGroup && participant?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{displayName}</p>
                          {conversation.isGroup && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0">
                              Group
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ""}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 truncate mb-1">
                        {conversation.lastMessage?.content || "No messages yet."}
                      </p>
                      <p className="text-xs text-gray-400">
                        {conversation.isGroup
                          ? `${conversation.participants.length} members`
                          : participant?.isOnline
                            ? "Online"
                            : `Last seen ${participant?.lastSeen ? new Date(participant.lastSeen).toLocaleTimeString() : "N/A"}`}
                      </p>
                    </div>
                  </div>

                  {conversation.isGroup && isGroupAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteGroup(conversation._id)
                      }}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all touch-manipulation"
                      title="Delete Group"
                      aria-label="Delete Group"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Mobile Conversations List */}
      {!isMobileConversationOpen && (
        <div className="lg:hidden w-full bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link
                  to="/dashboard"
                  className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Messages</h1>
              </div>
              <button
                onClick={() => {
                  setShowGroupModal(true)
                  fetchGroupUsers()
                }}
                className="p-2 sm:p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
                title="Create Group"
                aria-label="Create Group"
              >
                <Users size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            {!isSocketConnected && (
              <div className="text-sm text-red-500 mt-2 p-2 bg-red-50 rounded-lg">Connecting...</div>
            )}
          </div>

          <div className="overflow-y-auto h-[calc(100vh-80px)]">
            {error && <div className="p-4 text-red-600 bg-red-50 mx-4 mt-4 rounded-lg">{error}</div>}
            {conversations.length === 0 ? (
              <div className="p-6 text-gray-500 text-center">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-base mb-2">No conversations yet</p>
                <p className="text-sm text-gray-400">Start chatting with other players</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const participant = conversation.participants.find((p) => p._id !== user?.id)
                const displayName = conversation.isGroup ? conversation.groupName : participant?.username
                const isGroupAdmin = conversation.isGroup && conversation.groupAdmin?._id === user?.id

                return (
                  <div
                    key={conversation._id}
                    className="relative group p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <div
                      onClick={() => {
                        setSelectedConversationId(conversation._id)
                        setIsMobileConversationOpen(true)
                      }}
                      className="flex items-center space-x-3"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-full flex items-center justify-center">
                          {conversation.isGroup ? (
                            <Users size={20} className="sm:w-6 sm:h-6 text-gray-600" />
                          ) : (
                            <span className="font-medium text-sm sm:text-base text-gray-600">
                              {participant?.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {!conversation.isGroup && participant?.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <p className="font-medium text-base sm:text-lg text-gray-900 truncate">{displayName}</p>
                            {conversation.isGroup && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0">
                                Group
                              </span>
                            )}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0 ml-2">
                            {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ""}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 truncate mb-1">
                          {conversation.lastMessage?.content || "No messages yet."}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400">
                          {conversation.isGroup
                            ? `${conversation.participants.length} members`
                            : participant?.isOnline
                              ? "Online"
                              : `Last seen ${participant?.lastSeen ? new Date(participant.lastSeen).toLocaleTimeString() : "N/A"}`}
                        </p>
                      </div>
                    </div>

                    {conversation.isGroup && isGroupAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteGroup(conversation._id)
                        }}
                        className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all touch-manipulation"
                        title="Delete Group"
                        aria-label="Delete Group"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {(isMobileConversationOpen || selectedConversationId) && (
        <div className={`flex-1 flex flex-col bg-white ${!isMobileConversationOpen ? "hidden lg:flex" : ""}`}>
          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <button
                  onClick={() => {
                    setIsMobileConversationOpen(false)
                    setSelectedConversationId(null)
                    navigate("/messages")
                  }}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {currentConversation?.isGroup ? (
                      <Users size={18} className="sm:w-6 sm:h-6 text-gray-600" />
                    ) : (
                      <span className="font-medium text-sm sm:text-base text-gray-600">
                        {otherParticipant?.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {!currentConversation?.isGroup && otherParticipant?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                    {currentConversation?.isGroup ? currentConversation.groupName : otherParticipant?.username}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {isTyping
                      ? "Typing..."
                      : currentConversation?.isGroup
                        ? `${currentConversation.participants.length} members`
                        : otherParticipant?.isOnline
                          ? "Online"
                          : `Last seen ${otherParticipant?.lastSeen ? new Date(otherParticipant.lastSeen).toLocaleTimeString() : "N/A"}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {currentConversation?.isGroup && currentConversation.groupAdmin?._id === user?.id && (
                  <button
                    onClick={() => deleteGroup(currentConversation._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                    title="Delete Group"
                    aria-label="Delete Group"
                  >
                    <Trash2 size={18} className="sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {loadingMessages ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm sm:text-base">Loading messages...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">
                <p className="text-sm sm:text-base">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <Send size={32} className="mx-auto mb-4 text-gray-300" />
                <p className="text-base sm:text-lg mb-2">Start a conversation!</p>
                <p className="text-sm text-gray-400">Send your first message below</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.isOwn ? "justify-end" : "justify-start"} animate-slideInMessage`}
                >
                  <div
                    className={`relative max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${message.isOwn
                        ? `bg-blue-600 text-white rounded-br-sm ${message.isSending ? "opacity-70" : ""}`
                        : "bg-gray-100 text-gray-900 rounded-bl-sm"
                      }`}
                  >
                    {currentConversation?.isGroup && !message.isOwn && (
                      <p className="text-xs font-medium mb-1 opacity-75">{message.sender.username}</p>
                    )}
                    <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
                    <div className="flex items-center justify-between mt-1 sm:mt-2">
                      <p className={`text-xs ${message.isOwn ? "text-blue-100" : "text-gray-500"}`}>
                        {message.isSending ? "Sending..." : formatTime(message.timestamp)}
                      </p>
                      {message.isSending && (
                        <div className="ml-2 animate-spin">
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4 text-blue-100"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            ></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-2 sm:space-x-3">
              <button
                type="button"
                className="p-2 sm:p-3 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation flex-shrink-0"
                aria-label="Attach file"
              >
                <Paperclip size={18} className="sm:w-5 sm:h-5" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessageContent}
                  onChange={(e) => {
                    setNewMessageContent(e.target.value)
                    handleTyping()
                  }}
                  placeholder="Type a message..."
                  className="w-full px-4 py-3 sm:py-4 bg-gray-100 rounded-2xl sm:rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-base pr-12"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                  aria-label="Add emoji"
                >
                  <Smile size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <Button
                type="submit"
                disabled={!newMessageContent.trim() || !isSocketConnected}
                className="p-3 sm:p-4 rounded-full transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:transform-none touch-manipulation flex-shrink-0"
                aria-label="Send message"
              >
                <Send size={18} className="sm:w-5 sm:h-5" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Empty State - Desktop Only */}
      {!selectedConversationId && !isMobileConversationOpen && (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Send className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-sm sm:text-base text-gray-500">
              Choose a conversation from the sidebar to start chatting.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessagingPage
