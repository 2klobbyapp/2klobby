"use client"

import React, { useState, useEffect } from "react"
import { X, Play } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Button from "../components/Button"

const GettingStartedPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/auth')
      return
    }
  }, [navigate])

  // Tutorial content - you can replace these with your actual content
  const tutorialContent = {
    paragraph: "Welcome to our platform! This quick tutorial will show you how to create a player and message users effectively. Follow along with the videos below to get started quickly.",
    videos: [
      {
        id: "y65fjYBNr30", // Replace with your actual video ID
        title: "How to Create a Player",
        thumbnail: `https://img.youtube.com/vi/y65fjYBNr30/maxresdefault.jpg`
      },
      {
        id: "dQw4w9WgXcQ", // Replace with your actual video ID  
        title: "How to Message Users",
        thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg`
      }
    ]
  }

  const handleVideoPlay = (videoId: string) => {
    setActiveVideo(videoId)
  }

  const handleSkipTutorial = () => {
    // Get user info from localStorage to determine redirect
    const userStr = localStorage.getItem('user')
    let isAdmin = false
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        isAdmin = user.isAdmin || false
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    
    // Navigate to appropriate dashboard
    navigate(isAdmin ? "/admin" : "/dashboard")
  }

  const handleGetStarted = () => {
    handleSkipTutorial() // Same logic as skip
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
   
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Our Platform!
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {tutorialContent.paragraph}
          </p>
        </div>

        {/* Video Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Tutorial Videos
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tutorialContent.videos.map((video, index) => (
              <div key={video.id + index} className="group">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                  {activeVideo === video.id + index ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                      title={video.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      <button
                        onClick={() => handleVideoPlay(video.id + index)}
                        className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform"
                        aria-label={`Play ${video.title}`}
                      >
                        <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 shadow-lg transition-colors">
                          <Play size={32} className="text-white ml-1" fill="currentColor" />
                        </div>
                      </button>
                    </>
                  )}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mt-4 text-center">
                  {video.title}
                </h4>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={handleSkipTutorial}
            className="px-8 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors underline decoration-2 underline-offset-4"
          >
            Skip Tutorial
          </button>
          <Button
            onClick={handleGetStarted}
            className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Get Started
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span>Step 1 of 1 - Getting Started</span>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GettingStartedPage