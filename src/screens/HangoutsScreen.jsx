import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, MapPin, Clock, Users, Calendar, X, Image as ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { databases, ID, Query } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import client from '../lib/appwrite'

const HANGOUT_CATEGORIES = [
  { emoji: '📚', name: 'Study Session', color: 'neon-blue' },
  { emoji: '🎮', name: 'Gaming', color: 'neon-purple' },
  { emoji: '☕', name: 'Coffee/Food', color: 'neon-pink' },
  { emoji: '🏃', name: 'Sports', color: 'neon-green' },
  { emoji: '🎬', name: 'Movies', color: 'neon-blue' },
  { emoji: '🎨', name: 'Creative', color: 'neon-purple' },
  { emoji: '🎉', name: 'Party', color: 'neon-pink' },
  { emoji: '🎵', name: 'Music', color: 'neon-green' },
]

export default function HangoutsScreen() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuthStore()
  const [hangouts, setHangouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewHangout, setShowNewHangout] = useState(false)
  const [filter, setFilter] = useState('all') // all, joined, nearby

  useEffect(() => {
    loadHangouts()
    subscribeToHangouts()
  }, [filter])

  const loadHangouts = async () => {
    try {
      let queries = [
        Query.equal('university', userProfile.university),
        Query.orderDesc('createdAt'),
        Query.limit(50)
      ]

      if (filter === 'joined') {
        // Load only hangouts user has joined
        queries.push(Query.search('attendees', user.$id))
      }

      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_HANGOUTS_COLLECTION_ID,
        queries
      )

      setHangouts(response.documents)
      setLoading(false)
    } catch (error) {
      console.error('Load hangouts error:', error)
      setLoading(false)
    }
  }

  const subscribeToHangouts = () => {
    const unsubscribe = client.subscribe(
      `databases.${import.meta.env.VITE_APPWRITE_DATABASE_ID}.collections.${import.meta.env.VITE_APPWRITE_HANGOUTS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setHangouts((prev) => [response.payload, ...prev])
        } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          setHangouts((prev) =>
            prev.map((h) => (h.$id === response.payload.$id ? response.payload : h))
          )
        }
      }
    )

    return () => unsubscribe()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-neon-green"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/50 backdrop-blur-xl border-b border-white/10 p-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-neon-blue hover:text-neon-pink transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold neon-text">Hangouts</h1>
          <button
            onClick={() => setShowNewHangout(true)}
            className="w-10 h-10 bg-gradient-to-r from-neon-green to-neon-blue rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['all', 'joined'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-neon-green to-neon-blue'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? '🔥 All Events' : '✓ Joined'}
            </button>
          ))}
        </div>
      </div>

      {/* Hangouts Feed */}
      <div className="p-4 space-y-4 pb-20">
        {hangouts.length === 0 ? (
          <div className="text-center mt-20">
            <Users className="w-24 h-24 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Events Yet</h2>
            <p className="text-gray-400 mb-6">Create the first hangout on campus!</p>
            <button
              onClick={() => setShowNewHangout(true)}
              className="bg-gradient-to-r from-neon-green to-neon-blue px-8 py-3 rounded-full font-bold"
            >
              Create Hangout
            </button>
          </div>
        ) : (
          hangouts.map((hangout) => (
            <HangoutCard
              key={hangout.$id}
              hangout={hangout}
              currentUserId={user.$id}
              onUpdate={loadHangouts}
            />
          ))
        )}
      </div>

      {/* New Hangout Modal */}
      <AnimatePresence>
        {showNewHangout && (
          <NewHangoutModal
            onClose={() => setShowNewHangout(false)}
            university={userProfile.university}
            userId={user.$id}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Hangout Card Component
function HangoutCard({ hangout, currentUserId, onUpdate }) {
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)
  const isJoined = hangout.attendees?.includes(currentUserId)
  const isFull = hangout.maxAttendees > 0 && hangout.attendees?.length >= hangout.maxAttendees
  const isCreator = hangout.creatorId === currentUserId

  const handleJoin = async () => {
    if (joining || isFull) return

    setJoining(true)
    try {
      const updatedAttendees = isJoined
        ? hangout.attendees.filter((id) => id !== currentUserId)
        : [...(hangout.attendees || []), currentUserId]

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_HANGOUTS_COLLECTION_ID,
        hangout.$id,
        { attendees: updatedAttendees }
      )

      onUpdate()
    } catch (error) {
      console.error('Join error:', error)
      alert('Failed to join hangout')
    }
    setJoining(false)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString()

    if (isToday) return 'Today'
    if (isTomorrow) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const category = HANGOUT_CATEGORIES.find(c => hangout.title.includes(c.name)) || HANGOUT_CATEGORIES[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/10 hover:border-neon-green/50 transition-all"
    >
      {/* Header with Category */}
      <div className={`bg-gradient-to-r from-${category.color} to-${category.color}/50 p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{category.emoji}</span>
            <div>
              <h3 className="font-bold text-lg">{hangout.title}</h3>
              <p className="text-sm text-white/80">{hangout.university}</p>
            </div>
          </div>
          {isCreator && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
              Host
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-300 mb-4">{hangout.description}</p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-neon-blue" />
            <span>{formatDate(hangout.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-neon-purple" />
            <span>{formatTime(hangout.startTime)}</span>
          </div>
          {hangout.location && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <MapPin className="w-4 h-4 text-neon-pink" />
              <span className="truncate">{hangout.location}</span>
            </div>
          )}
        </div>

        {/* Attendees */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-neon-green" />
            <span className="font-semibold">
              {hangout.attendees?.length || 0}
              {hangout.maxAttendees > 0 && ` / ${hangout.maxAttendees}`} going
            </span>
          </div>
          {isFull && !isJoined && (
            <span className="text-xs text-red-400 font-semibold">FULL</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleJoin}
            disabled={joining || (isFull && !isJoined)}
            className={`flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isJoined
                ? 'bg-white/10 border-2 border-neon-green text-neon-green'
                : 'bg-gradient-to-r from-neon-green to-neon-blue'
            }`}
          >
            {joining ? 'Loading...' : isJoined ? '✓ Joined' : isFull ? 'Full' : 'Join'}
          </button>
          {hangout.location && (
            <button
              onClick={() => navigate('/map')}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all"
            >
              <MapPin className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// New Hangout Modal
function NewHangoutModal({ onClose, university, userId }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    maxAttendees: 0,
    isPublic: true
  })
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!formData.title || !formData.description || !formData.startTime) {
      alert('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_HANGOUTS_COLLECTION_ID,
        ID.unique(),
        {
          creatorId: userId,
          title: formData.title,
          description: formData.description,
          university: university,
          location: formData.location || '',
          latitude: 0,
          longitude: 0,
          attendees: [userId],
          maxAttendees: parseInt(formData.maxAttendees) || 0,
          startTime: formData.startTime,
          isPublic: formData.isPublic,
          createdAt: new Date().toISOString()
        }
      )

      onClose()
    } catch (error) {
      console.error('Create hangout error:', error)
      alert('Failed to create hangout. Please try again.')
    }
    setCreating(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 max-w-lg w-full border border-white/10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold neon-text">Create Hangout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3">Choose a category</label>
              <div className="grid grid-cols-2 gap-3">
                {HANGOUT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, title: cat.name })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.title === cat.name
                        ? `border-${cat.color} bg-${cat.color}/20`
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <span className="text-3xl mb-2 block">{cat.emoji}</span>
                    <span className="text-sm font-semibold">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.title}
              className="w-full bg-gradient-to-r from-neon-green to-neon-blue py-4 rounded-xl font-bold disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What's this hangout about?"
                rows={4}
                maxLength={300}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/300</p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold mb-2">Location (optional)</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Starbucks on Campus"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition-all"
              />
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-semibold mb-2">When? *</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-green transition-all"
              />
            </div>

            {/* Max Attendees */}
            <div>
              <label className="block text-sm font-semibold mb-2">Max People (0 = unlimited)</label>
              <input
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                min="0"
                max="100"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-green transition-all"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white/5 border border-white/20 py-3 rounded-xl font-bold hover:bg-white/10"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !formData.description || !formData.startTime}
                className="flex-1 bg-gradient-to-r from-neon-green to-neon-blue py-3 rounded-xl font-bold disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Hangout'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
