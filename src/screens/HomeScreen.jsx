import React, { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Heart, X, MessageCircle, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { databases, ID, Query } from '../lib/appwrite'
import Logo from '../components/Logo'
import cacheManager from '../lib/cacheManager'
import realtimeManager from '../lib/realtimeManager'
import { useToast } from '../hooks/useToast'
import { ProfileCardSkeleton } from '../components/SkeletonLoader'
import EmptyState from '../components/EmptyState'
import haptic from '../utils/haptic'
import ReportModal from '../components/ReportModal'
import logger from '../utils/logger'

// ProfileCard Component
const ProfileCard = React.memo(({ profile, onSwipe, onMessage, onReport }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-20, 20])
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0])

  const handleDragEnd = (event, info) => {
    if (Math.abs(info.offset.x) > 150) {
      haptic.medium()
      onSwipe(info.offset.x > 0 ? 'right' : 'left')
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, opacity }}
      onDragEnd={handleDragEnd}
      className="relative w-full max-w-sm h-[580px] cursor-grab active:cursor-grabbing"
    >
      <div className="absolute inset-0 bg-white rounded-2xl overflow-hidden shadow-xl">
        <button
          onClick={() => onReport(profile)}
          className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
        >
          <AlertTriangle className="w-5 h-5 text-white" />
        </button>

        <div className="relative w-full h-full">
          <img
            src={profile.photos?.[currentPhotoIndex] || profile.photos?.[0]}
            alt={profile.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-end justify-between mb-2.5">
            <div>
              <h2 className="text-3xl font-bold mb-0.5">{profile.name}, {profile.age}</h2>
              <p className="text-white/90 text-sm">{profile.university}</p>
            </div>
            <button 
              onClick={() => onMessage(profile)}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </button>
          </div>
          <p className="text-white/95 mb-3 line-clamp-2 text-sm">{profile.bio}</p>
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 3).map((interest, idx) => (
                <span key={idx} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        <motion.div
          style={{ opacity: useTransform(x, [0, 150], [0, 1]) }}
          className="absolute top-16 right-8 text-primary-500 text-6xl font-black rotate-12"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: useTransform(x, [-150, 0], [1, 0]) }}
          className="absolute top-16 left-8 text-red-500 text-6xl font-black -rotate-12"
        >
          NOPE
        </motion.div>
      </div>
    </motion.div>
  )
})

// MatchModal Component
const MatchModal = React.memo(({ user, matchId, onClose }) => {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">💕</div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">It's a Match!</h1>
        <p className="text-neutral-600 mb-6">You and {user.name} liked each other</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-neutral-100 text-neutral-900 py-3 rounded-full font-semibold hover:bg-neutral-200 transition-colors">
            Keep Swiping
          </button>
          <button onClick={() => { onClose(); navigate(`/chat/${matchId}`); }} className="flex-1 bg-primary-500 text-white py-3 rounded-full font-semibold hover:bg-primary-600 transition-colors">
            Send Message
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
})

// Main Component
export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedUser, setMatchedUser] = useState(null)
  const [matchIdForChat, setMatchIdForChat] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingProfile, setReportingProfile] = useState(null)

  useEffect(() => {
    loadProfiles()
    return () => realtimeManager.unsubscribeAll()
  }, [])

  const loadProfiles = async () => {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        [Query.notEqual('$id', user.$id), Query.limit(10)]
      )

      const realProfiles = response.documents
        .filter(doc => doc.name && doc.$id && doc.profileImage)
        .map(doc => ({
          id: doc.$id,
          name: doc.name,
          age: doc.age || 18,
          university: doc.university || 'University',
          bio: doc.bio || 'Hey there! 👋',
          interests: doc.interests || [],
          photos: [doc.profileImage]
        }))
      
      setProfiles(realProfiles)
      setLoading(false)
    } catch (error) {
      logger.error('Load profiles error:', error)
      setLoadError(error.message)
      setLoading(false)
    }
  }

  const handleSwipe = async (direction) => {
    if (direction === 'right') {
      try {
        const currentProfile = profiles[currentIndex]
        const matchDoc = await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
          ID.unique(),
          {
            user1Id: user.$id,
            user2Id: currentProfile.id,
            user1Liked: true,
            user2Liked: true,
            isMatched: true
          }
        )
        setMatchedUser(currentProfile)
        setMatchIdForChat(matchDoc.$id)
        setShowMatch(true)
      } catch (error) {
        logger.error('Match error:', error)
      }
    }
    setCurrentIndex(prev => prev + 1)
  }

  const handleMessage = async (profile) => {
    try {
      const matchDoc = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        ID.unique(),
        {
          user1Id: user.$id,
          user2Id: profile.id,
          user1Liked: true,
          user2Liked: true,
          isMatched: true
        }
      )
      navigate(`/chat/${matchDoc.$id}`)
    } catch (error) {
      logger.error('Message error:', error)
    }
  }

  const handleReport = (profile) => {
    setReportingProfile(profile)
    setShowReportModal(true)
  }

  const submitReport = async (reportData) => {
    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'reports',
        ID.unique(),
        {
          reporterId: user.$id,
          reportedUserId: reportData.profileId,
          reason: reportData.reason,
          details: reportData.details || ''
        }
      )
      showToast('Report submitted', 'success')
      setShowReportModal(false)
      setProfiles(prev => prev.filter(p => p.id !== reportData.profileId))
    } catch (error) {
      showToast('Failed to submit report', 'error')
    }
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><ProfileCardSkeleton /></div>
  if (loadError) return <div className="min-h-screen bg-white flex items-center justify-center p-4"><EmptyState icon="⚠️" title="Error" description={loadError} action="Try Again" onAction={loadProfiles} /></div>

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-neutral-100 z-10 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Logo size="md" variant="gradient" />
          <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 font-semibold hover:bg-neutral-200 transition-colors">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-8">
        {currentIndex < profiles.length ? (
          <>
            <ProfileCard profile={profiles[currentIndex]} onSwipe={handleSwipe} onMessage={handleMessage} onReport={handleReport} />
            <div className="flex gap-6 mt-6">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSwipe('left')} className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform border-2 border-neutral-200">
                <X className="w-8 h-8 text-red-500" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSwipe('right')} className="w-16 h-16 rounded-full bg-primary-500 shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
                <Heart className="w-8 h-8 text-white fill-current" />
              </motion.button>
            </div>
          </>
        ) : (
          <EmptyState icon="😊" title="You're all caught up!" description="Check back later" action="Refresh" onAction={loadProfiles} />
        )}
      </div>

      <AnimatePresence>
        {showReportModal && reportingProfile && (
          <ReportModal profile={reportingProfile} onClose={() => setShowReportModal(false)} onSubmit={submitReport} />
        )}
        {showMatch && matchedUser && matchIdForChat && (
          <MatchModal user={matchedUser} matchId={matchIdForChat} onClose={() => setShowMatch(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
