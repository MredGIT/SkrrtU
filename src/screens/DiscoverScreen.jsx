import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, Star, TrendingUp, Eye, Filter, X, Trophy, MapPin, Heart, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { databases, Query, ID } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import Logo from '../components/Logo'
import realtimeManager from '../lib/realtimeManager'
import { useToast } from '../hooks/useToast'

export default function DiscoverScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const [hotPicks, setHotPicks] = useState([])
  const [nearbyUsers, setNearbyUsers] = useState([])
  const [whoLikedYou, setWhoLikedYou] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)

  useEffect(() => {
    loadDiscoveryData()
    
    // Real-time updates for deleted users
    setupRealtimeUpdates()
    
    return () => {
      realtimeManager.unsubscribeAll()
    }
  }, [])

  const setupRealtimeUpdates = () => {
    const channel = `databases.${import.meta.env.VITE_APPWRITE_DATABASE_ID}.collections.${import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID}.documents`

    realtimeManager.subscribe(channel, (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
        const deletedUserId = response.payload.$id
        
        // Remove from all lists
        setHotPicks(prev => prev.filter(p => p.id !== deletedUserId))
        setNearbyUsers(prev => prev.filter(p => p.id !== deletedUserId))
        setTopUsers(prev => prev.filter(p => p.id !== deletedUserId))
        
        console.log('🗑️ Removed deleted user from discover')
      }
    })
  }

  const loadDiscoveryData = async () => {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        [
          Query.notEqual('$id', user.$id),
          Query.limit(50)
        ]
      )

      // Filter valid profiles only
      const users = response.documents
        .filter(doc => doc.name && doc.$id)
        .map(doc => ({
          id: doc.$id,
          name: doc.name,
          age: doc.age || 20,
          image: doc.profileImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          university: doc.university || 'University',
          bio: doc.bio || 'Hey there! 👋',
          interests: doc.interests || [],
          photos: doc.profileImage ? [doc.profileImage] : [],
          compatibility: Math.floor(Math.random() * 20) + 80,
          distance: `${Math.floor(Math.random() * 5) + 1} km away`
        }))

      if (users.length === 0) {
        setLoading(false)
        return
      }

      setHotPicks(users.slice(0, 6))
      setNearbyUsers(users.slice(6, 16))
      setTopUsers(users.slice(0, 8))
      
      setWhoLikedYou([
        { id: '1', blur: true },
        { id: '2', blur: true },
        { id: '3', blur: true }
      ])

      setLoading(false)
    } catch (error) {
      console.error('Load discovery error:', error)
      setLoading(false)
    }
  }

  const handleLike = async (profileId, profileName) => {
    try {
      console.log('Liking user:', profileName)
      
      const existingMatches = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        [
          Query.equal('isMatched', true),
          Query.limit(100)
        ]
      )

      const existingMatch = existingMatches.documents.find(match => 
        (match.user1Id === user.$id && match.user2Id === profileId) ||
        (match.user1Id === profileId && match.user2Id === user.$id)
      )

      if (existingMatch) {
        console.log('✅ Match already exists')
        showToast(`You already matched with ${profileName}!`, 'info')
        // Delay navigation slightly
        setTimeout(() => {
          navigate(`/chat/${existingMatch.$id}`)
        }, 500)
        return
      }

      const matchDoc = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        ID.unique(),
        {
          user1Id: user.$id,
          user2Id: profileId,
          user1Liked: true,
          user2Liked: true,
          isMatched: true
        }
      )

      console.log('✅ Match created:', matchDoc.$id)
      showToast(`It's a match with ${profileName}! 💕`, 'success')
      
      // Delay navigation
      setTimeout(() => {
        navigate(`/chat/${matchDoc.$id}`)
      }, 1000)
    } catch (error) {
      console.error('Like error:', error)
      showToast('Failed to create match. Please try again.', 'error')
    }
  }

  const handleMessage = async (profileId, profileName) => {
    try {
      console.log('Messaging user:', profileName)
      
      const existingMatches = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        [
          Query.equal('isMatched', true),
          Query.limit(100)
        ]
      )

      const existingMatch = existingMatches.documents.find(match => 
        (match.user1Id === user.$id && match.user2Id === profileId) ||
        (match.user1Id === profileId && match.user2Id === user.$id)
      )

      if (existingMatch) {
        navigate(`/chat/${existingMatch.$id}`)
        return
      }

      const matchDoc = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        ID.unique(),
        {
          user1Id: user.$id,
          user2Id: profileId,
          user1Liked: true,
          user2Liked: true,
          isMatched: true
        }
      )

      navigate(`/chat/${matchDoc.$id}`)
    } catch (error) {
      console.error('Message error:', error)
      showToast('Failed to start chat. Please try again.', 'error')
    }
  }

  const openProfile = (profile) => {
    setSelectedProfile(profile)
    setShowProfileModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="gradient" />
            <h1 className="text-xl font-bold text-neutral-900">Discover</h1>
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Filter className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-8">
        {/* Hot Picks Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-neutral-900">Hot Picks for You</h2>
            </div>
            <button 
              onClick={() => navigate('/home')}
              className="text-sm text-primary-500 font-semibold"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {hotPicks.map((profile) => (
              <motion.div
                key={profile.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => openProfile(profile)}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group"
              >
                <img
                  src={profile.image}
                  alt={profile.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white font-semibold text-sm truncate">{profile.name}, {profile.age}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-white">{profile.compatibility}% Match</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Who Liked You Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-bold text-neutral-900">Who Liked You</h2>
            </div>
            <span className="text-sm font-semibold text-primary-500">{whoLikedYou.length} likes</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {whoLikedYou.map((profile) => (
              <motion.div
                key={profile.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => alert('Upgrade to Premium to see who likes you!')}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-pink-400 backdrop-blur-xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white font-semibold text-xs">Upgrade to see</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => alert('Premium feature coming soon!')}
            className="w-full mt-3 bg-gradient-to-r from-primary-500 to-pink-500 text-white py-3 rounded-full font-semibold hover:scale-105 transition-transform"
          >
            See Who Likes You - Go Premium
          </button>
        </section>

        {/* Nearby Users Section - WITH ACTIONS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-neutral-900">Nearby on Campus</h2>
            </div>
            <span className="text-sm text-neutral-600">{nearbyUsers.length} people</span>
          </div>
          
          <div className="space-y-3">
            {nearbyUsers.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-neutral-200 rounded-2xl p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={profile.image}
                    alt={profile.name}
                    loading="lazy"
                    onClick={() => openProfile(profile)}
                    className="w-16 h-16 rounded-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900">{profile.name}, {profile.age}</h3>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="w-3 h-3" />
                      <span>{profile.distance}</span>
                    </div>
                    {profile.interests.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {profile.interests.slice(0, 2).map((interest, idx) => (
                          <span key={idx} className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMessage(profile.id, profile.name)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-full text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                  <button
                    onClick={() => handleLike(profile.id, profile.name)}
                    className="flex-1 bg-primary-500 text-white py-2 rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    Like
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Mini Leaderboard Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-neutral-900">Popular This Week</h2>
            </div>
            <button 
              onClick={() => navigate('/leaderboard')}
              className="text-sm text-primary-500 font-semibold"
            >
              View all
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4">
            <div className="space-y-3">
              {topUsers.slice(0, 3).map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-400 text-white' :
                    index === 1 ? 'bg-gray-300 text-white' :
                    'bg-orange-400 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm truncate">{profile.name}</p>
                    <p className="text-xs text-neutral-600">{profile.university}</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Profile Detail Modal */}
      {showProfileModal && selectedProfile && (
        <ProfileDetailModal 
          profile={selectedProfile} 
          onClose={() => setShowProfileModal(false)}
          onLike={() => handleLike(selectedProfile.id, selectedProfile.name)}
          onMessage={() => handleMessage(selectedProfile.id, selectedProfile.name)}
        />
      )}

      {/* Filter Modal */}
      {showFilters && <FilterModal onClose={() => setShowFilters(false)} />}
    </div>
  )
}

function ProfileDetailModal({ profile, onClose, onLike, onMessage }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const photos = profile.photos || [profile.image]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl overflow-hidden max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo */}
        <div className="relative aspect-[3/4]">
          <img
            src={photos[currentPhotoIndex]}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          
          {/* Photo indicators */}
          {photos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 flex gap-1.5">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-0.5 flex-1 rounded-full ${
                    idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Navigation */}
          {photos.length > 1 && (
            <div className="absolute inset-0 flex">
              <button
                onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                className="flex-1"
              />
              <button
                onClick={() => setCurrentPhotoIndex(Math.min(photos.length - 1, currentPhotoIndex + 1))}
                className="flex-1"
              />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-neutral-900 mb-1">
              {profile.name}, {profile.age}
            </h2>
            <div className="flex items-center gap-2 text-neutral-600">
              <MapPin className="w-4 h-4" />
              <span>{profile.distance || profile.university}</span>
            </div>
          </div>

          {profile.compatibility && (
            <div className="flex items-center gap-2 mb-4 bg-primary-50 px-3 py-2 rounded-full w-fit">
              <Star className="w-4 h-4 text-primary-600 fill-current" />
              <span className="text-sm font-semibold text-primary-700">{profile.compatibility}% Match</span>
            </div>
          )}

          <p className="text-neutral-700 mb-4">{profile.bio}</p>

          {profile.interests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onMessage}
              className="flex-1 bg-blue-500 text-white py-3 rounded-full font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Message
            </button>
            <button
              onClick={onLike}
              className="flex-1 bg-gradient-to-r from-primary-500 to-pink-500 text-white py-3 rounded-full font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5 fill-current" />
              Like
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function FilterModal({ onClose }) {
  const [filters, setFilters] = useState({
    ageRange: [18, 25],
    distance: 10,
    interests: []
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Filters</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Age Range */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}
            </label>
            <input
              type="range"
              min="18"
              max="30"
              value={filters.ageRange[1]}
              onChange={(e) => setFilters({ ...filters, ageRange: [18, parseInt(e.target.value)] })}
              className="w-full accent-primary-500"
            />
          </div>

          {/* Distance */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Max Distance: {filters.distance} km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={filters.distance}
              onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
              className="w-full accent-primary-500"
            />
          </div>

          {/* Apply Button */}
          <button
            onClick={onClose}
            className="w-full bg-primary-500 text-white py-3 rounded-full font-semibold hover:bg-primary-600 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
