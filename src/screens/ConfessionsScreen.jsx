import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, ThumbsUp, ThumbsDown, MessageCircle, AlertCircle, Send, X, Flag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { databases, ID, Query } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import client from '../lib/appwrite'

export default function ConfessionsScreen() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuthStore()
  const [confessions, setConfessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [filter, setFilter] = useState('recent')

  useEffect(() => {
    loadConfessions()
    subscribeToConfessions()
  }, [filter])

  const loadConfessions = async () => {
    try {
      let queries = [Query.orderDesc('createdAt'), Query.limit(50)]

      if (filter === 'my-university') {
        queries.push(Query.equal('university', userProfile.university))
      }

      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_CONFESSIONS_COLLECTION_ID,
        queries
      )

      setConfessions(response.documents)
      setLoading(false)
    } catch (error) {
      console.error('Load confessions error:', error)
      setLoading(false)
    }
  }

  const subscribeToConfessions = () => {
    const unsubscribe = client.subscribe(
      `databases.${import.meta.env.VITE_APPWRITE_DATABASE_ID}.collections.${import.meta.env.VITE_APPWRITE_CONFESSIONS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setConfessions((prev) => [response.payload, ...prev])
        }
      }
    )

    return () => unsubscribe()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-neon-purple"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white">
      <div className="sticky top-0 bg-black/50 backdrop-blur-xl border-b border-white/10 p-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-neon-blue hover:text-neon-pink transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold neon-text">Confessions</h1>
          <button
            onClick={() => setShowNewPost(true)}
            className="w-10 h-10 bg-gradient-to-r from-neon-pink to-neon-purple rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2">
          {['recent', 'my-university'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-neon-pink to-neon-purple'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {f === 'recent' ? '🔥 Recent' : '🎓 My Campus'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-20">
        {confessions.length === 0 ? (
          <div className="text-center mt-20">
            <AlertCircle className="w-24 h-24 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Confessions Yet</h2>
            <p className="text-gray-400 mb-6">Be the first to share something!</p>
            <button
              onClick={() => setShowNewPost(true)}
              className="bg-gradient-to-r from-neon-pink to-neon-purple px-8 py-3 rounded-full font-bold"
            >
              Post Anonymous Confession
            </button>
          </div>
        ) : (
          confessions.map((confession) => (
            <ConfessionCard key={confession.$id} confession={confession} />
          ))
        )}
      </div>

      <AnimatePresence>
        {showNewPost && (
          <NewConfessionModal
            onClose={() => setShowNewPost(false)}
            university={userProfile.university}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ConfessionCard({ confession }) {
  const { user } = useAuthStore()
  const [upvoted, setUpvoted] = useState(false)
  const [downvoted, setDownvoted] = useState(false)
  const [localUpvotes, setLocalUpvotes] = useState(confession.upvotes)
  const [localDownvotes, setLocalDownvotes] = useState(confession.downvotes)

  const handleVote = async (type) => {
    try {
      if (type === 'up') {
        if (upvoted) {
          setUpvoted(false)
          setLocalUpvotes(localUpvotes - 1)
        } else {
          setUpvoted(true)
          setLocalUpvotes(localUpvotes + 1)
          if (downvoted) {
            setDownvoted(false)
            setLocalDownvotes(localDownvotes - 1)
          }
        }
      } else {
        if (downvoted) {
          setDownvoted(false)
          setLocalDownvotes(localDownvotes - 1)
        } else {
          setDownvoted(true)
          setLocalDownvotes(localDownvotes + 1)
          if (upvoted) {
            setUpvoted(false)
            setLocalUpvotes(localUpvotes - 1)
          }
        }
      }

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_CONFESSIONS_COLLECTION_ID,
        confession.$id,
        {
          upvotes: type === 'up' ? (upvoted ? localUpvotes - 1 : localUpvotes + 1) : localUpvotes,
          downvotes: type === 'down' ? (downvoted ? localDownvotes - 1 : localDownvotes + 1) : localDownvotes
        }
      )
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-neon-pink to-neon-purple rounded-full flex items-center justify-center">
            <span className="text-lg">🎭</span>
          </div>
          <div>
            <p className="font-semibold">Anonymous</p>
            <p className="text-xs text-gray-400">{confession.university} • {formatTime(confession.createdAt)}</p>
          </div>
        </div>
      </div>

      <p className="text-gray-200 mb-4 leading-relaxed">{confession.content}</p>

      <div className="flex items-center gap-6 text-sm">
        <button
          onClick={() => handleVote('up')}
          className={`flex items-center gap-2 transition-colors ${
            upvoted ? 'text-neon-green' : 'text-gray-400 hover:text-neon-green'
          }`}
        >
          <ThumbsUp className="w-5 h-5" />
          <span className="font-semibold">{localUpvotes}</span>
        </button>

        <button
          onClick={() => handleVote('down')}
          className={`flex items-center gap-2 transition-colors ${
            downvoted ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
          }`}
        >
          <ThumbsDown className="w-5 h-5" />
          <span className="font-semibold">{localDownvotes}</span>
        </button>

        <div className="flex items-center gap-2 text-gray-400">
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold">{confession.replies || 0}</span>
        </div>
      </div>
    </motion.div>
  )
}

function NewConfessionModal({ onClose, university }) {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [posting, setPosting] = useState(false)

  const handlePost = async (e) => {
    e.preventDefault()
    if (!content.trim() || posting) return

    const badWords = ['fuck', 'shit', 'porn', 'sex', 'nude']
    const hasBadContent = badWords.some(word => content.toLowerCase().includes(word))
    
    if (hasBadContent) {
      alert('⚠️ Your confession contains inappropriate content. Please keep it clean!')
      return
    }

    setPosting(true)
    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_CONFESSIONS_COLLECTION_ID,
        ID.unique(),
        {
          authorId: user.$id,
          university: university,
          content: content.trim(),
          upvotes: 0,
          downvotes: 0,
          replies: 0,
          isAnonymous: isAnonymous,
          createdAt: new Date().toISOString()
        }
      )

      onClose()
    } catch (error) {
      console.error('Post confession error:', error)
      alert('Failed to post confession. Please try again.')
    }
    setPosting(false)
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
        className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 max-w-lg w-full border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold neon-text">New Confession</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handlePost}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts anonymously..."
            maxLength={500}
            rows={6}
            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-all resize-none mb-2"
            autoFocus
          />
          <p className="text-xs text-gray-500 mb-4">{content.length}/500 characters</p>

          <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎭</span>
              <div>
                <p className="font-semibold">Post Anonymously</p>
                <p className="text-xs text-gray-400">Your identity will be hidden</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`w-12 h-6 rounded-full transition-all ${
                isAnonymous ? 'bg-neon-purple' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  isAnonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-6">
            <p className="text-xs text-yellow-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Be respectful! Hateful, sexual, or harmful content will be removed.
            </p>
          </div>

          <button
            type="submit"
            disabled={!content.trim() || posting}
            className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white font-bold py-4 rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {posting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Posting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Post Confession
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
