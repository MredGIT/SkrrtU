import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { databases, Query } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import realtimeManager from '../lib/realtimeManager'
import Logo from '../components/Logo'

export default function ChatListScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [navigating, setNavigating] = useState(false)

  useEffect(() => {
    loadMatches()
    setupRealtimeUpdates()
    
    return () => {
      realtimeManager.unsubscribeAll()
    }
  }, [])

  const loadMatches = async () => {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        [
          Query.equal('isMatched', true),
          Query.limit(50)
        ]
      )

      const userMatches = response.documents.filter(
        match => match.user1Id === user.$id || match.user2Id === user.$id
      )

      // Remove duplicates
      const uniqueMatches = []
      const seenUsers = new Set()

      for (const match of userMatches) {
        const otherUserId = match.user1Id === user.$id ? match.user2Id : match.user1Id
        
        if (!seenUsers.has(otherUserId)) {
          seenUsers.add(otherUserId)
          uniqueMatches.push(match)
        }
      }

      // Load profiles and messages
      const matchesWithData = await Promise.all(
        uniqueMatches.map(async (match) => {
          const otherUserId = match.user1Id === user.$id ? match.user2Id : match.user1Id
          
          try {
            const profile = await databases.getDocument(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
              otherUserId
            )

            // Get last message
            try {
              const messages = await databases.listDocuments(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID,
                [
                  Query.equal('matchId', match.$id),
                  Query.limit(10)
                ]
              )

              const lastMsg = messages.documents[messages.documents.length - 1]
              const unreadCount = messages.documents.filter(
                m => !m.isRead && m.receiverId === user.$id
              ).length

              return {
                matchId: match.$id,
                profile: profile,
                lastMessage: lastMsg?.message || 'Say hi! 👋',
                lastMessageTime: lastMsg?.createdAt || match.$createdAt,
                unreadCount: unreadCount,
                isOnline: profile.isOnline || Math.random() > 0.5
              }
            } catch {
              return {
                matchId: match.$id,
                profile: profile,
                lastMessage: 'Say hi! 👋',
                lastMessageTime: match.$createdAt,
                unreadCount: 0,
                isOnline: profile.isOnline || false
              }
            }
          } catch {
            return null
          }
        })
      )

      const validMatches = matchesWithData
        .filter(m => m !== null)
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
      
      setMatches(validMatches)
      setLoading(false)
    } catch (error) {
      console.error('Load matches error:', error)
      setLoading(false)
    }
  }

  const setupRealtimeUpdates = () => {
    const channel = `databases.${import.meta.env.VITE_APPWRITE_DATABASE_ID}.collections.${import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID}.documents`

    realtimeManager.subscribe(channel, (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        // Reload matches when new message arrives
        loadMatches()
      }
    })
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredMatches = matches.filter(match =>
    match.profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleChatClick = (matchId) => {
    if (navigating) return // Prevent double-click
    
    setNavigating(true)
    navigate(`/chat/${matchId}`)
    
    // Reset after navigation
    setTimeout(() => setNavigating(false), 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Clean Header */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <Logo size="md" variant="gradient" />
            <h2 className="text-xl font-bold text-neutral-900">Messages</h2>
            <div className="w-16"></div> {/* Spacer */}
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-neutral-100 border-0 rounded-full py-2.5 pl-11 pr-4 text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="px-4 py-2">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">No messages yet</h2>
            <p className="text-neutral-600 mb-6 text-sm">Start swiping to make connections</p>
            <button
              onClick={() => navigate('/home')}
              className="bg-primary-500 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-primary-600 transition-colors"
            >
              Start Swiping
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredMatches.map((match) => (
              <motion.div
                key={match.matchId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChatClick(match.matchId)}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 cursor-pointer transition-colors active:bg-neutral-100 ${
                  navigating ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  <img
                    src={match.profile.profileImage || 'https://via.placeholder.com/150'}
                    alt={match.profile.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {match.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary-500 rounded-full border-2 border-white"></div>
                  )}
                  {match.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-primary-500 rounded-full flex items-center justify-center px-1.5">
                      <span className="text-xs font-bold text-white">{match.unreadCount}</span>
                    </div>
                  )}
                </div>

                {/* Message Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <h3 className={`font-semibold text-neutral-900 truncate ${match.unreadCount > 0 ? 'font-bold' : ''}`}>
                      {match.profile.name}
                    </h3>
                    <span className={`text-xs flex-shrink-0 ml-2 ${match.unreadCount > 0 ? 'text-primary-500 font-semibold' : 'text-neutral-500'}`}>
                      {formatTimestamp(match.lastMessageTime)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${match.unreadCount > 0 ? 'text-neutral-900 font-medium' : 'text-neutral-600'}`}>
                    {match.lastMessage}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
