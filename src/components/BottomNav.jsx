import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Flame, MessageCircle, User, Calendar, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { databases, Query } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import { throttle } from '../utils/debounce'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadUnreadCount()
      const interval = setInterval(loadUnreadCount, 10000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadUnreadCount = async () => {
    try {
      if (!user) return

      const matches = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        [
          Query.equal('isMatched', true),
          Query.limit(50)
        ]
      )

      const userMatches = matches.documents.filter(
        match => match.user1Id === user.$id || match.user2Id === user.$id
      )

      let totalUnread = 0
      for (const match of userMatches) {
        try {
          const messages = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID,
            [
              Query.equal('matchId', match.$id),
              Query.equal('isRead', false),
              Query.equal('receiverId', user.$id),
              Query.limit(50)
            ]
          )
          totalUnread += messages.documents.length
        } catch (err) {
          // Skip
        }
      }

      setUnreadCount(totalUnread)
    } catch (error) {
      console.error('Load unread error:', error)
    }
  }

  // Throttle navigation to prevent rapid clicks
  const handleNavigation = useMemo(
    () => throttle((path) => {
      if (location.pathname !== path) {
        navigate(path)
      }
    }, 500),
    [navigate, location.pathname]
  )

  const tabs = [
    { path: '/home', icon: Flame, label: 'Discover' },
    { path: '/discover', icon: Trophy, label: 'Explore' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/chat', icon: MessageCircle, label: 'Chats', badge: unreadCount },
    { path: '/profile', icon: User, label: 'Profile' }
  ]

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 safe-bottom shadow-lg"
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          const Icon = tab.icon
          
          return (
            <button
              key={tab.path}
              onClick={() => handleNavigation(tab.path)}
              className="relative flex flex-col items-center justify-center flex-1 py-2 transition-colors"
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-colors ${
                  isActive ? 'text-primary-500' : 'text-neutral-400'
                }`} />
                {tab.badge > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-primary-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-[10px] font-bold text-white">{tab.badge > 9 ? '9+' : tab.badge}</span>
                  </div>
                )}
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"
                />
              )}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
