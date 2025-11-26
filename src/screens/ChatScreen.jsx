import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send } from 'lucide-react'
import { databases, ID, Query } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../hooks/useToast'
import realtimeManager from '../lib/realtimeManager'
import haptic from '../utils/haptic'

export default function ChatScreen() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const messagesEndRef = useRef(null)
  
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [otherUser, setOtherUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    console.log('ChatScreen mounted:', { matchId, user: user?.name })
    
    if (!matchId || !user) {
      console.error('Missing matchId or user:', { matchId, user })
      setError('Invalid match')
      setLoading(false)
      return
    }

    loadMatchAndMessages()
    setupRealtimeMessages()
    
    return () => {
      realtimeManager.unsubscribeAll()
    }
  }, [matchId, user])

  const loadMatchAndMessages = async () => {
    try {
      console.log('Loading match:', matchId)
      
      // Load match
      const matchDoc = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        matchId
      )
      
      console.log('Match loaded:', matchDoc)

      // Determine other user
      const otherUserId = matchDoc.user1Id === user.$id ? matchDoc.user2Id : matchDoc.user1Id
      console.log('Other user ID:', otherUserId)

      // Load other user profile
      const otherUserProfile = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        otherUserId
      )
      
      console.log('Other user loaded:', otherUserProfile.name)

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
      
      console.log('Messages loaded:', messagesResponse.documents.length)

      setMessages(messagesResponse.documents)
      setLoading(false)

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Load match error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        type: error.type
      })
      setError(`Error: ${error.message}`)
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
    if (e) {
      e.preventDefault()
    }

    if (!newMessage.trim() || isSending || !otherUser) {
      console.log('Cannot send:', { 
        hasMessage: !!newMessage.trim(), 
        isSending, 
        hasOtherUser: !!otherUser 
      })
      return
    }

    setIsSending(true)

    try {
      console.log('Sending message:', {
        matchId,
        senderId: user.$id,
        receiverId: otherUser.$id,
        message: newMessage.trim()
      })

      const messageDoc = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          matchId: matchId,
          senderId: user.$id,
          receiverId: otherUser.$id,
          message: newMessage.trim(),
          imageUrl: null,
          isRead: false
        }
      )

      console.log('Message sent successfully:', messageDoc.$id)

      setNewMessage('')
      haptic.selection()
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Send message error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        type: error.type
      })
      showToast(`Failed to send: ${error.message}`, 'error')
    }

    setIsSending(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => navigate('/chat')} className="bg-primary-500 text-white px-6 py-2 rounded-full">
            Back to Chats
          </button>
        </div>
      </div>
    )
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Loading user...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Clean Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => navigate('/chat')} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <img
            src={otherUser?.profileImage || 'https://via.placeholder.com/150'}
            alt={otherUser?.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="font-semibold text-neutral-900">{otherUser?.name}</h2>
            <p className="text-xs text-neutral-500">{otherUser?.university}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 mt-8">
            <p>No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user.$id
            
            return (
              <motion.div
                key={msg.$id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isMe
                      ? 'bg-primary-500 text-white rounded-br-sm'
                      : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{msg.message || msg.content}</p>
                  <span className={`text-xs ${isMe ? 'text-white/70' : 'text-neutral-500'} mt-1 block`}>
                    {new Date(msg.$createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Clean Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 p-4 bg-white">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 bg-neutral-100 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
