import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Filter, Heart, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { databases, Query, ID } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import Logo from '../components/Logo'

export default function MapScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, nearby, university

  useEffect(() => {
    loadNearbyUsers()
  }, [filter])

  const loadNearbyUsers = async () => {
    try {
      let queries = [
        Query.notEqual('$id', user.$id),
        Query.limit(50)
      ]

      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        queries
      )

      console.log('Loaded users:', response.documents.length)
      setUsers(response.documents)
      setLoading(false)
    } catch (error) {
      console.error('Load users error:', error)
      setLoading(false)
    }
  }

  const handleLike = async (userId) => {
    try {
      const matchId = ID.unique()
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        matchId,
        {
          user1Id: user.$id,
          user2Id: userId,
          user1Liked: true,
          user2Liked: true,
          isMatched: true
        }
      )
      alert('Liked! Check your matches 💕')
    } catch (error) {
      console.error('Like error:', error)
    }
  }

  const handleMessage = async (userId) => {
    console.log('Creating match to message user:', userId)
    
    try {
      // First, check if match already exists
      const existingMatches = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        [
          Query.equal('isMatched', true),
          Query.limit(100)
        ]
      )

      // Check if a match already exists between these two users
      const existingMatch = existingMatches.documents.find(match => 
        (match.user1Id === user.$id && match.user2Id === userId) ||
        (match.user1Id === userId && match.user2Id === user.$id)
      )

      if (existingMatch) {
        console.log('✅ Match already exists:', existingMatch.$id)
        navigate(`/chat/${existingMatch.$id}`)
        return
      }

      // Create new match if none exists
      const matchId = ID.unique()
      
      const matchDoc = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        matchId,
        {
          user1Id: user.$id,
          user2Id: userId,
          user1Liked: true,
          user2Liked: true,
          isMatched: true
        }
      )

      console.log('✅ Match created:', matchDoc.$id)
      navigate(`/chat/${matchDoc.$id}`)
      
    } catch (error) {
      console.error('❌ Failed to create match:', error)
      alert(`Failed to start chat: ${error.message}`)
    }
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
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="gradient" />
            <div className="h-6 w-px bg-neutral-200"></div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">Nearby</h1>
              <p className="text-xs text-neutral-500">{users.length} people</p>
            </div>
          </div>
          <button className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Grid */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {users.map((nearbyUser) => (
            <motion.div
              key={nearbyUser.$id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-dark-100 rounded-2xl overflow-hidden shadow-lg"
            >
              <div className="relative aspect-[3/4]">
                <img
                  src={nearbyUser.profileImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'}
                  alt={nearbyUser.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-bold text-lg">{nearbyUser.name}, {nearbyUser.age || 18}</h3>
                  <div className="flex items-center gap-1 text-white/80 text-xs mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{nearbyUser.university}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLike(nearbyUser.$id)}
                      className="flex-1 bg-white/20 backdrop-blur-lg py-2 rounded-full flex items-center justify-center gap-1 hover:bg-white/30 transition-all"
                    >
                      <Heart className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleMessage(nearbyUser.$id)}
                      className="flex-1 bg-gradient-to-r from-primary-500 to-pink-500 py-2 rounded-full flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No one nearby</h3>
            <p className="text-gray-500 dark:text-gray-400">Check back later for new people!</p>
          </div>
        )}
      </div>
    </div>
  )
}
