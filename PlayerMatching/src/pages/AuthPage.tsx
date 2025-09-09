"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Eye, EyeOff } from "lucide-react"
import Button from "../components/Button"
import API from "../api/api"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

// Loading component for login/register state
const LoadingSpinner: React.FC = React.memo(() => (
  <div className="flex items-center justify-center h-48 sm:h-64">
    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-4 border-b-4 border-blue-600"></div>
  </div>
))

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      try {
        let response
        if (isSignUp) {
          if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.")
            setLoading(false)
            return
          }
          response = await API.post("/auth/register", {
            username: formData.username,
            email: formData.email,
            password: formData.password,
          })
        } else {
          response = await API.post("/auth/login", {
            email: formData.email,
            password: formData.password,
          })
        }

        if (response.data.user.isBanned) {
          setError(`Account banned: ${response.data.user.banReason || "Contact support for more information."}`)
          setLoading(false)
          return
        }

        login(response.data.token)
        console.log("User role:", response.data.user.isAdmin ? "Admin" : "User")
        navigate(response.data.user.isAdmin ? "/admin" : "/tutorial")
      } catch (err: any) {
        console.error("Authentication error:", err.response?.data || err.message)
        setError(err.response?.data?.msg || "An unexpected error occurred. Please try again.")
      } finally {
        setLoading(false)
      }
    },
    [formData, isSignUp, login, navigate],
  )

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }, [])

  const toggleSignUp = useCallback(() => {
    setIsSignUp((prev) => !prev)
    setError(null)
    setFormData({ username: "", email: "", password: "", confirmPassword: "" })
  }, [])

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  const headingText = useMemo(
    () => ({
      title: isSignUp ? "Sign Up" : "Sign In",
      subtitle: isSignUp ? "Fill the form below to create your account" : "Enter your credentials to log in",
    }),
    [isSignUp],
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm sm:max-w-md w-full space-y-6 sm:space-y-8">
        {/* Mobile Logo */}
        <div className="text-center md:hidden">
          <div className="w-16 h-16 sm:w-18 sm:h-18 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-4 sm:mb-6 shadow-md">
            <svg
              className="w-9 h-9 sm:w-10 sm:h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-2 2-2 2-2-.9-2-2zm0 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-2-2-2-2z"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{headingText.title}</h2>
          <p className="text-sm sm:text-base text-gray-600">{headingText.subtitle}</p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-5 sm:space-y-6 border border-gray-200">
            {error && (
              <div
                className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r text-sm sm:text-base"
                role="alert"
              >
                <span className="block font-medium">{error}</span>
              </div>
            )}

            {/* Desktop Header */}
            <div className="text-center hidden md:block">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{headingText.title}</h2>
              <p className="text-sm sm:text-base text-gray-600">{headingText.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 sm:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                    placeholder="Enter a unique username"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sm:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
 
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 sm:py-3.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1 touch-manipulation"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 sm:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                    placeholder="Confirm your password"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-3 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 text-base min-h-[48px]"
                loading={loading}
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={toggleSignUp}
                className="text-blue-600 hover:text-blue-800 text-sm sm:text-base font-medium transition-colors duration-200 p-2 touch-manipulation"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthPage