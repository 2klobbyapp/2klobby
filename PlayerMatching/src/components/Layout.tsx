"use client"

import type React from "react"
import { useState } from "react"
import { Menu, X, MessageSquare } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const navigationItems = [
    { label: "Find Players", path: "/search" },
    ...(isAuthenticated ? [{ label: "Add a Player", path: "/add-player" }] : []),
    ...(user?.isAdmin ? [{ label: "Admin", path: "/admin" }] : []),
  ]

  const handleNavClick = (item: { label: string; path: string }) => {
    if (!isAuthenticated && item.path === "/search") {
      navigate("/auth")
    } else {
      navigate(item.path)
    }
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-3 -ml-3 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Left side - Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm sm:text-base lg:text-lg">2K</span>
                </div>
                <span className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-900 hidden xs:block">2K Lobby</span>
              </Link>
            </div>

            {/* Center Navigation - Hidden on mobile and tablet, shown on desktop */}
            <nav className="hidden lg:flex space-x-6 xl:space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item)}
                  className={`text-sm xl:text-base font-medium transition-colors hover:text-gray-900 px-3 py-2 rounded-md ${
                    location.pathname === item.path ? "text-gray-900 bg-gray-50" : "text-gray-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/messages"
                    className="p-2 sm:p-2.5 lg:p-3 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                    aria-label="Messages"
                  >
                    <MessageSquare size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-600" />
                  </Link>

                  <Link
                    to="/dashboard"
                    className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:shadow-md transition-shadow touch-manipulation"
                    aria-label="Dashboard"
                  >
                    <span className="text-white text-sm sm:text-base lg:text-lg font-medium">
                      {user?.username.charAt(0).toUpperCase() || "U"}
                    </span>
                  </Link>

                  <button
                    onClick={logout}
                    className="hidden sm:block text-sm lg:text-base font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="text-sm lg:text-base font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-md hover:bg-gray-50 touch-manipulation"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <nav className="px-4 py-6 space-y-2 max-h-96 overflow-y-auto">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item)}
                  className={`block w-full text-left px-4 py-4 rounded-lg transition-colors touch-manipulation text-base font-medium ${
                    location.pathname === item.path
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/messages"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-4 rounded-lg transition-colors touch-manipulation text-base font-medium ${
                      location.pathname === "/messages"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Messages
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-4 rounded-lg transition-colors touch-manipulation text-base font-medium ${
                      location.pathname === "/dashboard"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Dashboard
                  </Link>

                  <div className="border-t border-gray-200 my-4"></div>
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-4 rounded-lg text-red-600 hover:bg-red-50 transition-colors touch-manipulation text-base font-semibold"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-4 rounded-lg transition-colors touch-manipulation text-base font-medium ${
                    location.pathname === "/auth"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default Layout