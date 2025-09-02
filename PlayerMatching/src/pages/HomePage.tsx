"use client"

import type React from "react"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Star, User, Search, Zap, MessageSquare, Gamepad2, Monitor } from "lucide-react"
import { Link } from "react-router-dom"
import Button from "../components/Button"
import PlayerCard from "../components/PlayerCard"
import nba2k26Image from "../assets/nba-2k26-1.png"

const HomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const featuredPlayers = [
    {
      id: "1",
      owner: {
        username: "ProPlayer23",
        isOnline: true,
      },
      name: "CourtKing23",
      position: "Point Guard",
      rating: 95,
      badges: [
        { name: "Playmaker", level: "Hall of Fame" },
        { name: "Ankle Breaker", level: "Legend" },
        { name: "Dimer", level: "Gold" },
      ],
      console: "PlayStation 5",
      timezone: "EST",
      photo: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg",
    },
    {
      id: "2",
      owner: {
        username: "EliteGamer",
        isOnline: false,
      },
      name: "DunkMaster",
      position: "Center",
      rating: 92,
      badges: [
        { name: "Paint Patroller", level: "Legend" },
        { name: "Physical Finisher", level: "Hall of Fame" },
        { name: "Brick Wall", level: "Gold" },
      ],
      console: "Xbox Series X",
      timezone: "PST",
      photo: "https://images.pexels.com/photos/1040944/pexels-photo-1040944.jpeg",
    },
    {
      id: "3",
      owner: {
        username: "SharpShooter",
        isOnline: true,
      },
      name: "ShotCaller",
      position: "Shooting Guard",
      rating: 88,
      badges: [
        { name: "Deadeye", level: "Legend" },
        { name: "Limitless Range", level: "Hall of Fame" },
        { name: "Set Shot Specialist", level: "Gold" },
      ],
      console: "PC",
      timezone: "CST",
    },
    {
      id: "4",
      owner: {
        username: "CourtVision",
        isOnline: true,
      },
      name: "FloorGeneral",
      position: "Point Guard",
      rating: 91,
      badges: [
        { name: "Dimer", level: "Hall of Fame" },
        { name: "Handles For Days", level: "Gold" },
        { name: "Break Starter", level: "Silver" },
      ],
      console: "PlayStation 5",
      timezone: "EST",
    },
    {
      id: "5",
      owner: {
        username: "BigManDown",
        isOnline: false,
      },
      name: "PaintBeast",
      position: "Power Forward",
      rating: 89,
      badges: [
        { name: "Post Powerhouse", level: "Legend" },
        { name: "Paint Prodigy", level: "Hall of Fame" },
        { name: "Immovable Enforcer", level: "Gold" },
      ],
      console: "Xbox Series X",
      timezone: "MST",
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredPlayers.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredPlayers.length) % featuredPlayers.length)
  }

  const stats = [
    { icon: User, label: "Active Players", value: "12,500+" },
    { icon: MessageSquare, label: "Teams Formed", value: "3,200+" },
    { icon: Star, label: "Games Played", value: "45,000+" },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white min-h-[85vh] sm:min-h-[90vh] flex items-center"
        style={{
          backgroundImage: `url(${nba2k26Image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/60 sm:bg-black/50"></div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight text-balance">
              Find Your Squad.
              <br />
              <span className="text-blue-200">Dominate the Court.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed text-pretty">
              Connect with skilled NBA 2K players, form unstoppable teams, and dominate in REC, Pro-Am, and Park modes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto">
              <Link to="/auth" className="w-full sm:w-auto flex justify-center">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 min-h-[48px] px-8 text-base font-semibold rounded-3xl"
                >
                  Sign Up Free
                </Button>
              </Link>
              <Link to="/search" className="w-full sm:w-auto flex justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-gray-900 bg-transparent min-h-[48px] px-8 text-base font-semibold rounded-3xl"
                >
                  Browse Players
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 text-balance">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
              Get started in three simple steps and find your perfect NBA 2K squad today.
            </p>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-2 max-w-[300px]"></div>
            <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">2</div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-2 max-w-[300px]"></div>
            <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">3</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Your Player Profile</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Upload your NBA 2K player details, badges, ratings, and preferred game modes to showcase your skills.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Search & Connect</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Browse through thousands of players, filter by position, console, timezone, and rating to find your perfect teammates.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Up & Dominate</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Message players, form your squad, and dominate the court in REC, Pro-Am, and Park game modes.
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <Link to="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 min-h-[48px] px-8 text-base font-semibold rounded-xl">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 text-balance">
              Why Choose 2K Lobby?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
              The most advanced platform for finding NBA 2K teammates with powerful features designed for serious players.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Player Search</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Filter players by position, rating, badges, console, timezone, and game modes to find your perfect teammates.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Messaging</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Connect instantly with players through our built-in messaging system. Coordinate games and build lasting teams.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast Matching</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our smart matching algorithm connects you with compatible players in seconds, not hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 text-balance">
              All Platforms Supported
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
              Find teammates across all NBA 2K platforms. Cross-platform compatibility means more players to choose from.
            </p>
          </div>

          <div className="flex justify-center items-center gap-8 sm:gap-12 lg:gap-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900">PlayStation 5</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-4">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900">Xbox Series X/S</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-2xl flex items-center justify-center mb-4">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900">PC</p>
            </div>
          </div>

          <div className="flex justify-center mt-6 sm:mt-8">
            <Link to="/search" className="flex justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 min-h-[48px] px-8 text-base font-semibold rounded-xl">
                Start Finding Teammates
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Players Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 text-balance">
              Featured Players
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-xl lg:max-w-2xl mx-auto text-pretty">
              Join thousands of NBA 2K players who have found their ideal teammates through 2K Lobby.
            </p>
          </div>

          <div className="lg:hidden relative">
            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {featuredPlayers.map((player) => (
                  <div key={player.id} className="w-full flex-shrink-0 px-3 sm:px-4">
                    <PlayerCard player={player} showActions={false} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 sm:mt-8">
              <button
                onClick={prevSlide}
                className="p-3 sm:p-4 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 touch-manipulation"
                aria-label="Previous player"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>

              <div className="flex space-x-2 sm:space-x-3">
                {featuredPlayers.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 touch-manipulation ${
                      index === currentSlide ? "bg-blue-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="p-3 sm:p-4 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 touch-manipulation"
                aria-label="Next player"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {featuredPlayers.slice(0, 3).map((player) => (
              <PlayerCard key={player.id} player={player} showActions={false} />
            ))}
          </div>

          <div className="flex justify-center mt-8 sm:mt-12 lg:mt-16">
            <Link to="/search" className="flex justify-center">
              <Button size="lg" className="min-h-[48px] px-8 text-base font-semibold rounded-xl">
                View All Players
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 text-balance">
            Ready to Find Your Perfect Squad?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto text-pretty">
            Join thousands of NBA 2K players who have found their ideal teammates through 2K Lobby.
          </p>
          <div className="flex justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 min-h-[48px] px-8 text-base font-semibold rounded-xl">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage