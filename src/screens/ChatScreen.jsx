import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Smile, MoreVertical, Check, CheckCheck } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { databases, ID, Query } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import realtimeManager from '../lib/realtimeManager'
import notificationManager from '../lib/notificationManager'

export default function ChatScreen() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [otherUser, setOtherUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    loadMatchAndMessages()
    setupRealtimeMessages()
    
    return () => {
      realtimeManager.unsubscribeAll()
    }
  }, [matchId])

  const loadMatchAndMessages = async () => {
    try {
      // Load match details
      const matchDoc = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        matchId
      )

      // FIX: Determine which user is the OTHER person
      const otherUserId = matchDoc.user1Id === user.$id ? matchDoc.user2Id : matchDoc.user1Id

      // Load other user's profile
      const otherUserProfile = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        otherUserId
      )

      setOtherUser(otherUserProfile)

      // Load messages
      const messagesResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID,
        [
          Query.equal('matchId', matchId),
          Query.orderAsc('$createdAt'),
          Query.limit(100)
        ]
      )

      setMessages(messagesResponse.documents)
      setLoading(false)

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Load match error:', error)
      setLoading(false)
    }
  }

  const setupRealtimeMessages = () => {
    const channel = `databases.${import.meta.env.VITE_APPWRITE_DATABASE_ID}.collections.${import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID}.documents`

    realtimeManager.subscribe(
      channel,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const newMsg = response.payload
          
          if (newMsg.matchId === matchId) {
            setMessages((prev) => {
              if (prev.some(m => m.$id === newMsg.$id)) {
                return prev
              }
              
              const updated = [...prev, newMsg].sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
              )
              return updated
            })
            
            if (newMsg.senderId !== user.$id) {
              setIsTyping(true)
              setTimeout(() => setIsTyping(false), 800)
              
              // Show notification if app is in background
              if (document.hidden) {
                notificationManager.newMessage(otherUser.name, newMsg.message)
              }
            }
          }
        }
      },
      {
        onConnect: () => {
          setConnectionStatus('connected')
        },
        onDisconnect: () => {
          setConnectionStatus('reconnecting')
          setTimeout(() => loadMatchAndMessages(), 2000)
        },
        onError: () => {
          setConnectionStatus('offline')
        }
      }
    )
  }

  const sendMessage = async (e) => {
    // Prevent form submission/page refresh
    if (e) {
      e.preventDefault()
    }

    if (!newMessage.trim()) return

    setSending(true)

    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          matchId: matchId,
          senderId: user.$id, // Current logged in user
          receiverId: otherUser.$id, // The other person
          content: newMessage.trim(),
          read: false
        }
      )

      setNewMessage('')
      
    } catch (error) {
      console.error('Send message error:', error)
    }

    setSending(false)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col pb-20">
      {/* Clean Header */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => navigate('/chat')}
            className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-800" />
          </button>
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <img
                src={otherUser.profileImage || 'https://via.placeholder.com/150'}
                alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {otherUser.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-neutral-900 truncate text-sm">{otherUser.name}</h2>
              <p className="text-xs text-neutral-500">
                {connectionStatus === 'connected' && otherUser.isOnline && 'Active now'}
                {connectionStatus === 'connected' && !otherUser.isOnline && 'Offline'}
              </p>
            </div>
          </div>

          <button className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">Start the conversation</h3>
            <p className="text-sm text-neutral-500">Say hello to {otherUser.name}!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === user.$id
              const showDate = idx === 0 || 
                formatDate(messages[idx - 1].createdAt) !== formatDate(msg.createdAt)
              const showTime = idx === messages.length - 1 ||
                messages[idx + 1]?.senderId !== msg.senderId ||
                new Date(messages[idx + 1]?.createdAt).getTime() - new Date(msg.createdAt).getTime() > 60000

              return (
                <div key={msg.$id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-end gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isMe && (
                      <img
                        src={otherUser.profileImage}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          isMe
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-neutral-900 shadow-sm'
                        } ${isMe ? 'rounded-br-md' : 'rounded-bl-md'}`}
                      >
                        <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                      </div>
                      
                      {showTime && (
                        <div className={`flex items-center gap-1 mt-1 px-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-xs text-neutral-400">{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            <span className="text-primary-500">
                              {msg.status === 'sending' && <Check className="w-3 h-3" />}
                              {msg.status === 'sent' && <CheckCheck className="w-3 h-3" />}
                              {msg.isRead && <CheckCheck className="w-3 h-3 text-blue-500" />}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-end gap-2"
                >
                  <img src={otherUser.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                  <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          className="w-2 h-2 bg-neutral-400 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Clean Input Bar */}
      <div className="bg-white border-t border-neutral-200 px-4 py-3 safe-bottom">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="w-full bg-neutral-100 border-0 rounded-full py-2.5 pl-4 pr-10 text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              newMessage.trim()
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
