"use client"

import React, { useMemo } from "react"
import { MessageSquare, Star, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { Link } from "react-router-dom"
import Button from "./Button"

// Define stricter types
interface Badge {
  name: string
  level?: string
  _id?: string
}

interface Player {
  id: string
  owner?: {
    username: string
    isOnline: boolean
  }
  name: string
  position: string
  rating: number
  badges: Badge[] | string[]
  console: string
  timezone: string
  avatar?: string
  photo?: string
  price?: string
  currency?: string
}

interface PlayerCardProps {
  player: Player
  showActions?: boolean
  showEditActions?: boolean
  onMessage?: (playerId: string) => void
  onEdit?: (playerId: string) => void
  onDelete?: (playerId: string) => void
  compact?: boolean
}

// Badge rendering component
const BadgeItem: React.FC<{ badge: Badge | string; getBadgeColor: (level?: string) => string }> = ({
  badge,
  getBadgeColor,
}) => {
  const isObject = typeof badge === "object"
  const badgeName = isObject ? badge.name : badge
  const badgeLevel = isObject ? badge.level : undefined
  return (
    <span
      className={`inline-block px-2 py-1 text-xs sm:text-xs rounded-full border ${getBadgeColor(badgeLevel)} whitespace-nowrap`}
    >
      {badgeName}
    </span>
  )
}

// Image rendering component
const PlayerImage: React.FC<{
  photo?: string
  avatar?: string
  name: string
  isCompact: boolean
}> = ({ photo, avatar, name, isCompact }) => {
  if (isCompact) {
    return photo ? (
      <img src={photo || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{name.charAt(0)}</span>
      </div>
    )
  }
  return photo || avatar ? (
    <img src={photo || avatar} alt={name} className="w-full h-full rounded-full object-cover" loading="lazy" />
  ) : (
    <span className="text-lg sm:text-xl font-bold text-gray-600">{name.charAt(0)}</span>
  )
}

// Action buttons component
const ActionButtons: React.FC<{
  showActions: boolean
  showEditActions: boolean
  playerId: string
  onMessage?: (playerId: string) => void
  onEdit?: (playerId: string) => void
  onDelete?: (playerId: string) => void
}> = ({ showActions, showEditActions, playerId, onMessage, onEdit, onDelete }) => {
  if (!showActions && !showEditActions) return null

  const handleEditClick = () => {
    if (!playerId) {
      console.error("PlayerCard: Invalid player.id")
      return
    }
    console.log("PlayerCard: onEdit called with player.id:", playerId)
    onEdit?.(playerId)
  }

  const handleDeleteClick = () => {
    if (!playerId) {
      console.error("PlayerCard: Invalid player.id")
      return
    }
    console.log("PlayerCard: onDelete called with player.id:", playerId)
    onDelete?.(playerId)
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {showEditActions ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            className="flex-1 text-xs sm:text-sm flex items-center justify-center min-h-[40px] sm:min-h-[44px] touch-manipulation bg-transparent"
          >
            <Edit size={14} className="mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Edit</span>
            <span className="xs:hidden">E</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDeleteClick}
            className="flex-1 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white flex items-center justify-center min-h-[40px] sm:min-h-[44px] touch-manipulation"
          >
            <Trash2 size={14} className="mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Delete</span>
            <span className="xs:hidden">D</span>
          </Button>
        </>
      ) : showActions ? (
        <Button
          size="sm"
          onClick={() => onMessage?.(playerId)}
          className="flex-1 text-xs sm:text-sm bg-gray-900 hover:bg-gray-800 flex items-center justify-center min-h-[40px] sm:min-h-[44px] touch-manipulation"
        >
          <MessageSquare size={14} className="mr-1 sm:mr-2" />
          <span>Message</span>
        </Button>
      ) : null}
    </div>
  )
}

const PlayerCard: React.FC<PlayerCardProps> = React.memo(
  ({ player, showActions = true, showEditActions = false, onMessage, onEdit, onDelete, compact = true }) => {
    const getBadgeColor = (level?: string) => {
      if (!level) return "bg-blue-100 text-blue-800 border-blue-200"
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

    const sortedBadges = useMemo(() => {
      return [...player.badges].sort((a, b) => {
        const aLevel = typeof a === "object" ? a.level : undefined
        const bLevel = typeof b === "object" ? b.level : undefined
        return getBadgeLevelPriority(bLevel) - getBadgeLevelPriority(aLevel)
      })
    }, [player.badges])

    // Validate player data
    if (!player.id || !player.name) {
      console.error("Invalid player data:", player)
      return null
    }

    if (compact) {
      return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group">
          <Link to={`/player/${player.id}`} className="block">
            <div className="aspect-square relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
              <PlayerImage photo={player.photo} avatar={player.avatar} name={player.name} isCompact={true} />
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                <div className="flex items-center space-x-1 sm:space-x-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                  <span className="text-xs sm:text-sm font-bold text-white">{player.rating}</span>
                </div>
              </div>
              {player.owner?.isOnline && (
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white shadow-sm" />
                </div>
              )}
              <button className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-black/30 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation">
                <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </button>
            </div>
          </Link>
          <div className="p-3 sm:p-4">
            <Link to={`/player/${player.id}`} className="block">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 hover:text-blue-600 transition-colors truncate mb-1">
                {player.name}
              </h3>
            </Link>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{player.position}</p>
            <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
              {sortedBadges.slice(0, 2).map((badge, index) => (
                <BadgeItem key={index} badge={badge} getBadgeColor={getBadgeColor} />
              ))}
              {player.badges.length > 2 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200 whitespace-nowrap">
                  +{player.badges.length - 2}
                </span>
              )}
            </div>
            {player.price && (
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm text-gray-500">Availability:</span>
                <span className="font-medium text-xs sm:text-sm text-gray-900">
                  {player.price} {player.currency}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3 sm:mb-4">
              <span className="truncate">{player.console}</span>
              {player.owner && (
                <span className="flex items-center space-x-1 ml-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${player.owner.isOnline ? "bg-green-400" : "bg-gray-400"}`}
                  />
                  <span className="truncate max-w-[80px] sm:max-w-none">{player.owner.username}</span>
                </span>
              )}
            </div>
            <ActionButtons
              showActions={showActions}
              showEditActions={showEditActions}
              playerId={player.id}
              onMessage={onMessage}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-200 hover:shadow-md hover:border-blue-200 hover:-translate-y-1">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <PlayerImage photo={player.photo} avatar={player.avatar} name={player.name} isCompact={false} />
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/player/${player.id}`} className="block">
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 hover:text-blue-600 transition-colors truncate">
                {player.name}
              </h3>
            </Link>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm sm:text-base text-gray-600">{player.position}</span>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm sm:text-base font-medium">{player.rating}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
              {sortedBadges.slice(0, 3).map((badge, index) => (
                <BadgeItem key={index} badge={badge} getBadgeColor={getBadgeColor} />
              ))}
              {player.badges.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                  +{player.badges.length - 3} more
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
              <span className="truncate">{player.console}</span>
              <span>{player.timezone}</span>
              {player.owner && (
                <span className="flex items-center space-x-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${player.owner.isOnline ? "bg-green-400" : "bg-gray-400"}`}
                  />
                  <span className="truncate">by {player.owner.username}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-6">
          <ActionButtons
            showActions={showActions}
            showEditActions={showEditActions}
            playerId={player.id}
            onMessage={onMessage}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    )
  },
)

const getBadgeLevelPriority = (level?: string) => {
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

export default PlayerCard
