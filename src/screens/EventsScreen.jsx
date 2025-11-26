import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Users, Plus, Clock, Bookmark, X, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { databases, ID, Query } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import Logo from '../components/Logo'
import realtimeManager from '../lib/realtimeManager'
import { useToast } from '../hooks/useToast'
import { EventCardSkeleton } from '../components/SkeletonLoader'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import haptic from '../utils/haptic'

export default function EventsScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([]) // Events user is attending
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [eventToLeave, setEventToLeave] = useState(null)

  useEffect(() => {
    loadEvents()
    setupRealtimeUpdates()
    
    return () => {
      realtimeManager.unsubscribeAll()
    }
  }, [])

  const setupRealtimeUpdates = () => {
    const channel = `databases.${import.meta.env.VITE_APPWRITE_DATABASE_ID}.collections.${import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID}.documents`

    realtimeManager.subscribe(channel, (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        const newEvent = response.payload
        setEvents(prev => [formatEvent(newEvent), ...prev])
      }
      
      if (response.events.includes('databases.*.collections.*.documents.*.update')) {
        const updatedEvent = response.payload
        setEvents(prev => prev.map(e => e.id === updatedEvent.$id ? formatEvent(updatedEvent) : e))
      }
      
      if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
        const deletedEventId = response.payload.$id
        setEvents(prev => prev.filter(e => e.id !== deletedEventId))
      }
    })
  }

  const formatEvent = (doc) => ({
    id: doc.$id,
    title: doc.title,
    type: doc.type,
    hostId: doc.hostId,
    hostName: doc.hostName || 'Campus Host',
    attendees: doc.attendees || [],
    maxAttendees: doc.maxAttendees,
    date: doc.date,
    startTime: doc.startTime, // Changed from 'time' to 'startTime'
    location: doc.location,
    description: doc.description,
    createdAt: doc.$createdAt
  })

  const loadEvents = async () => {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID || 'events',
        [
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]
      )

      const formattedEvents = response.documents.map(formatEvent)
      setEvents(formattedEvents)
      
      // Filter events user is attending
      const attending = formattedEvents.filter(e => e.attendees.includes(user.$id))
      setMyEvents(attending)
      
      setLoading(false)
    } catch (error) {
      console.error('Load events error:', error)
      
      if (error.code === 404 || error.message.includes('not found')) {
        console.warn('⚠️ Events collection error')
      }
      
      setEvents([])
      setLoading(false)
    }
  }

  const handleJoinEvent = async (eventId) => {
    haptic.light()
    
    try {
      const event = events.find(e => e.id === eventId)
      if (!event) return

      if (event.attendees.includes(user.$id)) {
        showToast("You're already attending this event!", 'info')
        return
      }

      if (event.attendees.length >= event.maxAttendees) {
        showToast("This event is full!", 'error')
        haptic.error()
        return
      }

      const updatedAttendees = [...event.attendees, user.$id]

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID || 'events',
        eventId,
        {
          attendees: updatedAttendees
        }
      )

      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, attendees: updatedAttendees } : e
      ))
      
      haptic.success()
      showToast(`You're going to ${event.title}! 🎉`, 'success')
    } catch (error) {
      console.error('Join event error:', error)
      haptic.error()
      showToast('Failed to join event. Please try again.', 'error')
    }
  }

  const handleLeaveEvent = async (eventId) => {
    try {
      const event = events.find(e => e.id === eventId)
      if (!event) return

      const updatedAttendees = event.attendees.filter(id => id !== user.$id)

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID || 'events',
        eventId,
        {
          attendees: updatedAttendees
        }
      )

      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, attendees: updatedAttendees } : e
      ))
      
      haptic.light()
      showToast('You left the event', 'info')
    } catch (error) {
      console.error('Leave event error:', error)
      haptic.error()
      showToast('Failed to leave event', 'error')
    }
  }

  const getEventIcon = (type) => {
    switch(type) {
      case 'study': return '📚'
      case 'social': return '🎉'
      case 'fitness': return '💪'
      case 'food': return '🍕'
      default: return '📅'
    }
  }

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    if (filter === 'going') return event.attendees.includes(user.$id)
    if (filter === 'hosting') return event.hostId === user.$id
    return event.type === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-20">
        {/* ...existing header... */}
        <div className="px-4 py-4 space-y-4">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
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
            <h1 className="text-xl font-bold text-neutral-900">Events & Hangouts</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Going', 'Hosting', 'Study', 'Social', 'Fitness'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f.toLowerCase())}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === f.toLowerCase()
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="px-4 py-4 space-y-4">
        {filteredEvents.length === 0 ? (
          <EmptyState
            icon="🎪"
            title="No events yet"
            description="Be the first to create one!"
            action="Create Event"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          filteredEvents.map((event) => {
            const isAttending = event.attendees.includes(user.$id)
            const isFull = event.attendees.length >= event.maxAttendees
            const isHost = event.hostId === user.$id

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{getEventIcon(event.type)}</span>
                        <h3 className="font-bold text-neutral-900">{event.title}</h3>
                      </div>
                      <p className="text-sm text-neutral-600">
                        {isHost ? 'You are hosting' : `Hosted by ${event.hostName}`}
                      </p>
                    </div>
                    {isHost && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                        Host
                      </span>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date} at {event.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees.length}/{event.maxAttendees} going</span>
                      {isFull && <span className="text-red-500 font-semibold">(FULL)</span>}
                    </div>
                  </div>

                  <p className="text-sm text-neutral-700 mb-4">{event.description}</p>

                  {/* Action Buttons with confirmation */}
                  <div className="flex gap-2">
                    {isHost ? (
                      <button
                        onClick={() => showToast('Manage event coming soon!', 'info')}
                        className="flex-1 bg-neutral-100 text-neutral-700 py-2.5 rounded-full font-semibold hover:bg-neutral-200 transition-colors"
                      >
                        Manage Event
                      </button>
                    ) : isAttending ? (
                      <button
                        onClick={() => {
                          setEventToLeave(event)
                          setShowLeaveConfirm(true)
                        }}
                        className="flex-1 bg-red-100 text-red-700 py-2.5 rounded-full font-semibold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Going - Leave
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinEvent(event.id)}
                        disabled={isFull}
                        className={`flex-1 py-2.5 rounded-full font-semibold transition-colors ${
                          isFull
                            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                            : 'bg-primary-500 text-white hover:bg-primary-600'
                        }`}
                      >
                        {isFull ? 'Event Full' : "I'm Going!"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Leave Event Confirmation */}
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={() => {
          if (eventToLeave) {
            handleLeaveEvent(eventToLeave.id)
            setEventToLeave(null)
          }
        }}
        title="Leave Event?"
        message={`Are you sure you want to leave "${eventToLeave?.title}"?`}
        confirmText="Leave"
        cancelText="Stay"
        danger={false}
      />

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateEventModal 
            onClose={() => setShowCreateModal(false)} 
            onSuccess={loadEvents}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateEventModal({ onClose, onSuccess }) {
  const { user, userProfile } = useAuthStore()
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    title: '',
    type: 'social',
    date: '',
    time: '', // Keep this
    location: '',
    maxAttendees: 10,
    description: ''
  })
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID || 'events',
        ID.unique(),
        {
          title: formData.title,
          type: formData.type,
          date: formData.date,
          time: formData.time, // Send both
          startTime: formData.time, // Send both
          location: formData.location,
          maxAttendees: formData.maxAttendees,
          description: formData.description,
          hostId: user.$id,
          hostName: userProfile?.name || user.name,
          attendees: [user.$id],
          createdAt: new Date().toISOString()
        }
      )

      showToast('Event created! 🎉', 'success')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Create event error:', error)
      showToast(`Failed to create event: ${error.message}`, 'error')
    }
    setCreating(false)
  }

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
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-neutral-900">Create Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Event title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-neutral-100 border-0 rounded-xl py-3 px-4 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />

          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full bg-neutral-100 border-0 rounded-xl py-3 px-4 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="study">📚 Study Group</option>
            <option value="social">🎉 Social Event</option>
            <option value="fitness">💪 Fitness</option>
            <option value="food">🍕 Food</option>
            <option value="other">📅 Other</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-neutral-100 border-0 rounded-xl py-3 px-4 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="bg-neutral-100 border-0 rounded-xl py-3 px-4 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <input
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full bg-neutral-100 border-0 rounded-xl py-3 px-4 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />

          <input
            type="number"
            placeholder="Max attendees"
            value={formData.maxAttendees}
            onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) })}
            min="2"
            max="100"
            className="w-full bg-neutral-100 border-0 rounded-xl py-3 px-4 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full bg-neutral-100 border-0 rounded-xl py-3 px-4 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            required
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-100 text-neutral-900 py-3 rounded-full font-semibold hover:bg-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 bg-primary-500 text-white py-3 rounded-full font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
