"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Filter, ChevronDown, Gamepad2, Clock, Grid3x3, List, X } from "lucide-react"
import PlayerCard from "../components/PlayerCard"
import API from "../api/api"
import { useNavigate } from "react-router-dom"
import debounce from "lodash/debounce"

// Define Player interface
interface Player {
  id: string
  owner?: {
    _id: string
    username: string
    isOnline: boolean
  }
  name: string
  position: string
  rating: number
  badges: Array<{ name: string; level?: string; _id?: string }> | string[]
  console: string
  timezone: string
  avatar?: string
  photo?: string
  price?: string
  currency?: string
}

interface Filters {
  position: string
  console: string
  timezone: string
  minRating: number
  maxRating: number
  status: "all" | "online" | "available"
  search: string
  nba2kTitle: string[]
}

// Skeleton component for PlayerCard
const PlayerCardSkeleton: React.FC<{ compact: boolean }> = React.memo(({ compact }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      {compact ? (
        <div className="space-y-3">
          <div className="aspect-square bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded w-1/2" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
            <div className="flex gap-2">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
            <div className="flex gap-4">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="flex justify-end gap-2">
              <div className="h-8 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-20" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

// Filter section component
const FilterSection: React.FC<{
  title: string
  children: React.ReactNode
}> = ({ title, children }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <ChevronDown size={16} className="text-gray-400" />
    </div>
    {children}
  </div>
)

const SearchPage: React.FC = () => {
  const [activeView, setActiveView] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"trending" | "recent">("trending")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    position: "",
    console: "",
    timezone: "",
    minRating: 70,
    maxRating: 99,
    status: "all",
    search: "",
    nba2kTitle: ["2K26"], // Initialize with "2K26" checked
  })
  const [searchResults, setSearchResults] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const positions = useMemo(
    () => [
      { value: "Point Guard", label: "Point Guard" },
      { value: "Shooting Guard", label: "Shooting Guard" },
      { value: "Small Forward", label: "Small Forward" },
      { value: "Power Forward", label: "Power Forward" },
      { value: "Center", label: "Center" },
    ],
    [],
  )

  const consoles = useMemo(
    () => ["PlayStation 5", "Xbox Series X", "Xbox Series S", "PC", "PlayStation 4", "Xbox One"],
    [],
  )

  const timezones = useMemo(
    () => [
      "EST",
      "CST",
      "MST",
      "PST",
      "EDT",
      "CDT",
      "MDT",
      "PDT",
      "AST",
      "HST",
      "GMT",
      "CET",
      "EET",
      "WET",
      "BST",
      "CEST",
      "JST",
      "KST",
      "CST (China)",
      "IST",
      "AEST",
      "ACST",
      "AWST",
      "UTC",
      "BRT",
      "ART",
    ],
    [],
  )

  const navigate = useNavigate()

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        position: filters.position || undefined,
        console: filters.console || undefined,
        timezone: filters.timezone || undefined,
        minRating: filters.minRating > 60 ? filters.minRating : undefined,
        maxRating: filters.maxRating < 99 ? filters.maxRating : undefined,
        status: filters.status === "all" ? undefined : filters.status,
        search: filters.search || undefined,
        sortBy,
        nba2kTitle: filters.nba2kTitle.length > 0 ? filters.nba2kTitle : undefined,
      }
      const response = await API.get("/players", { params })
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
      setSearchResults(mappedPlayers)
    } catch (err: any) {
      console.error("Failed to fetch players:", err.response?.data || err.message)
      setError(err.response?.data?.msg || "Failed to load players.")
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  // Debounce search input to reduce API calls
  const debouncedHandleSearch = useCallback(
    debounce((value: string) => {
      setFilters((prev) => ({ ...prev, search: value }))
    }, 300),
    [],
  )

  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      if (name === "search") {
        debouncedHandleSearch(value)
      } else if (name === "nba2kTitle") {
        const updatedTitles = (e.target as HTMLInputElement).checked
          ? [...filters.nba2kTitle, value]
          : filters.nba2kTitle.filter((title) => title !== value)
        setFilters((prev) => ({ ...prev, nba2kTitle: updatedTitles }))
      } else {
        setFilters((prev) => ({
          ...prev,
          [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }))
      }
    },
    [debouncedHandleSearch, filters.nba2kTitle],
  )

  const handleRatingChange = useCallback((type: "minRating" | "maxRating", value: string) => {
    const numValue = Number.parseInt(value)
    if (!isNaN(numValue)) {
      setFilters((prev) => ({
        ...prev,
        [type]: numValue,
      }))
    }
  }, [])

  const handleMessage = useCallback(
    async (playerId: string) => {
      try {
        const response = await API.get(`/players/${playerId}`)
        const owner_id = response.data.owner?._id
        if (!owner_id) {
          console.error("Player owner ID is missing:", response.data)
          return
        }
        const conversationResponse = await API.post("/conversations", { participantId: owner_id })
        if (conversationResponse.data?._id) {
          navigate(`/messages`, { state: { conversation_id: conversationResponse.data._id } })
        } else {
          console.error("Failed to create/get conversation:", conversationResponse)
        }
      } catch (err) {
        console.error("Error in handleMessage:", err)
      }
    },
    [navigate],
  )

  const filterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "minRating") return value !== 70
      if (key === "maxRating") return value !== 99
      if (key === "nba2kTitle") return value.length > 0
      if (typeof value === "string") return value !== "" && value !== "all"
      return false
    }).length
  }, [filters])

  const skeletonCount = useMemo(() => {
    if (activeView === "grid") {
      return window.innerWidth >= 1280 ? 8 : window.innerWidth >= 1024 ? 6 : window.innerWidth >= 768 ? 4 : 2
    }
    return 3
  }, [activeView])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-white border-r border-gray-200 min-h-screen p-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b-2 border-gray-900 inline-block">
              Players
            </h2>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Filter size={18} />
              <span className="font-medium">Filters</span>
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full">{filterCount}</div>
            </div>
            <button
              onClick={() =>
                setFilters({
                  position: "",
                  console: "",
                  timezone: "",
                  minRating: 70,
                  maxRating: 99,
                  status: "all",
                  search: "",
                  nba2kTitle: [],
                })
              }
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
          <FilterSection title="Position">
            <div className="space-y-2">
              {positions.map((pos) => (
                <label key={pos.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="position"
                    value={pos.value}
                    checked={filters.position === pos.value}
                    onChange={handleFilterChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{pos.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>
          <FilterSection title="Status">
            <div className="flex space-x-2">
              {["all", "online", "available"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, status: status as Filters["status"] }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filters.status === status ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </FilterSection>
          <FilterSection title="Rating">
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="60"
                max="99"
                name="minRating"
                value={filters.minRating}
                onChange={(e) => handleRatingChange("minRating", e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="number"
                min="60"
                max="99"
                name="maxRating"
                value={filters.maxRating}
                onChange={(e) => handleRatingChange("maxRating", e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">OVR</span>
            </div>
          </FilterSection>
          <FilterSection title="Console">
            <div className="space-y-2">
              {consoles.map((consoleOption) => (
                <label key={consoleOption} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="console"
                    value={consoleOption}
                    checked={filters.console === consoleOption}
                    onChange={handleFilterChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Gamepad2 size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{consoleOption}</span>
                  </div>
                </label>
              ))}
            </div>
          </FilterSection>
          <FilterSection title="NBA 2K Title">
            <div className="space-y-2">
              {["2K26"].map((title) => (
                <label key={title} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="nba2kTitle"
                    value={title}
                    checked={filters.nba2kTitle.includes(title)}
                    onChange={handleFilterChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Gamepad2 size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{title}</span>
                  </div>
                </label>
              ))}
            </div>
          </FilterSection>
          <FilterSection title="Timezone">
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                name="timezone"
                value={filters.timezone}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
              >
                <option value="">All Timezones</option>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </FilterSection>
        </div>

        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)} />
            <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Filter size={18} />
                    <span className="font-medium">Active Filters</span>
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full">{filterCount}</div>
                  </div>
                  <button
                    onClick={() =>
                      setFilters({
                        position: "",
                        console: "",
                        timezone: "",
                        minRating: 70,
                        maxRating: 99,
                        status: "all",
                        search: "",
                        nba2kTitle: [],
                      })
                    }
                    className="text-sm text-gray-500 hover:text-gray-700 touch-manipulation"
                  >
                    Clear all
                  </button>
                </div>

                <FilterSection title="Position">
                  <div className="space-y-3">
                    {positions.map((pos) => (
                      <label key={pos.value} className="flex items-center space-x-3 touch-manipulation">
                        <input
                          type="radio"
                          name="position"
                          value={pos.value}
                          checked={filters.position === pos.value}
                          onChange={handleFilterChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span className="text-base text-gray-700">{pos.label}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Status">
                  <div className="flex flex-col space-y-2">
                    {["all", "online", "available"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, status: status as Filters["status"] }))}
                        className={`px-4 py-3 rounded-lg text-base font-medium transition-colors touch-manipulation ${
                          filters.status === status
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Rating">
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="60"
                      max="99"
                      name="minRating"
                      value={filters.minRating}
                      onChange={(e) => handleRatingChange("minRating", e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    />
                    <span className="text-base text-gray-500">to</span>
                    <input
                      type="number"
                      min="60"
                      max="99"
                      name="maxRating"
                      value={filters.maxRating}
                      onChange={(e) => handleRatingChange("maxRating", e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    />
                    <span className="text-base text-gray-500">OVR</span>
                  </div>
                </FilterSection>

                <FilterSection title="Console">
                  <div className="space-y-3">
                    {consoles.map((consoleOption) => (
                      <label key={consoleOption} className="flex items-center space-x-3 touch-manipulation">
                        <input
                          type="radio"
                          name="console"
                          value={consoleOption}
                          checked={filters.console === consoleOption}
                          onChange={handleFilterChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <div className="flex items-center space-x-2">
                          <Gamepad2 size={18} className="text-gray-400" />
                          <span className="text-base text-gray-700">{consoleOption}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="NBA 2K Title">
                  <div className="space-y-3">
                    {["2K26", "2K25", "2K24"].map((title) => (
                      <label key={title} className="flex items-center space-x-3 touch-manipulation">
                        <input
                          type="checkbox"
                          name="nba2kTitle"
                          value={title}
                          checked={filters.nba2kTitle.includes(title)}
                          onChange={handleFilterChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <div className="flex items-center space-x-2">
                          <Gamepad2 size={18} className="text-gray-400" />
                          <span className="text-base text-gray-700">{title}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Timezone">
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      name="timezone"
                      value={filters.timezone}
                      onChange={handleFilterChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base appearance-none bg-white touch-manipulation"
                    >
                      <option value="">All Timezones</option>
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </FilterSection>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors touch-manipulation"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden p-3 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation flex items-center space-x-2"
              >
                <Filter size={18} />
                <span className="text-sm font-medium">Filters</span>
                {filterCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                    {filterCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setSortBy(sortBy === "trending" ? "recent" : "trending")}
                  className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
                >
                  <span className="text-sm font-medium">{sortBy === "trending" ? "Trending" : "Recent"}</span>
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Search players..."
                defaultValue={filters.search}
                name="search"
                onChange={handleFilterChange}
                className="flex-1 sm:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
              />

              <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setActiveView("grid")}
                  className={`p-2.5 rounded touch-manipulation ${activeView === "grid" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"}`}
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setActiveView("list")}
                  className={`p-2.5 rounded touch-manipulation ${activeView === "list" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          <p className="text-sm sm:text-base text-gray-600 mb-6">
            {loading ? "Loading..." : `${searchResults.length} players found`}
          </p>

          {loading ? (
            <div
              className={`grid gap-4 sm:gap-6 ${
                activeView === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              }`}
            >
              {[...Array(skeletonCount)].map((_, index) => (
                <PlayerCardSkeleton key={index} compact={activeView === "grid"} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              <p className="text-base mb-4">{error}</p>
              <button onClick={fetchPlayers} className="text-blue-600 underline hover:text-blue-800 touch-manipulation">
                Retry
              </button>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-base">No players found matching your criteria.</p>
            </div>
          ) : (
            <div
              className={`grid gap-4 sm:gap-6 ${
                activeView === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              }`}
            >
              {searchResults.map((player) => (
                <PlayerCard key={player.id} player={player} onMessage={handleMessage} compact={activeView === "grid"} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchPage