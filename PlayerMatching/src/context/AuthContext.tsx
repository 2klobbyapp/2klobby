"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, type ReactNode } from "react"
import { jwtDecode } from "jwt-decode"

interface DecodedToken {
  user: {
    id: string
    username: string
    email: string
  }
  exp: number
}

interface User {
  id: string
  username: string
  email: string
  timezone?: string
  preferredConsole?: string
  bio?: string
  isOnline?: boolean
  profileVisibility?: string
  showOnlineStatus?: boolean
  allowInvites?: boolean
  joinDate?: string
  totalPlayers?: number
  lastSeen?: string
  avatar?: string
  isAdmin?: boolean
  isBanned?: boolean
  banReason?: string
}

interface AuthContextType {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (token: string) => void
  logout: () => void
  updateUser: (updatedUser: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      try {
        const decoded = jwtDecode<DecodedToken>(storedToken)
        const currentTime = Date.now() / 1000
        if (decoded.exp < currentTime) {
          console.log("Token expired. Logging out.")
          logout()
        } else {
          setToken(storedToken)
          setUser(decoded.user)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Failed to decode token or token is invalid:", error)
        logout()
      }
    }
    setLoading(false)
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken)
    setToken(newToken)
    try {
      const decoded = jwtDecode<DecodedToken>(newToken)
      console.log("Decoded user:", decoded.user)
      setUser(decoded.user)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Failed to decode token after login:", error)
      logout()
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser })
    }
  }

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
