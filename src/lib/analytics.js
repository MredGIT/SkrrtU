import { databases, ID } from './appwrite'

class Analytics {
  constructor() {
    this.sessionStart = Date.now()
    this.events = []
    this.enabled = false // Disable for now since analytics collection doesn't exist
  }

  // Track user actions
  async trackEvent(eventName, properties = {}) {
    // Just log to console instead of trying to save to database
    console.log('📊 Analytics:', eventName, properties)
    
    if (!this.enabled) {
      return
    }

    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      properties: properties,
      sessionDuration: Date.now() - this.sessionStart
    }

    this.events.push(event)

    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'analytics', // Create this collection
        ID.unique(),
        {
          eventName,
          properties: JSON.stringify(properties),
          timestamp: new Date().toISOString()
        }
      )
    } catch (error) {
      // Silently fail - don't break app
      console.log('Analytics error (ignored):', error.message)
    }
  }

  // Track key metrics
  trackSwipe(direction, profileId) {
    this.trackEvent('swipe', { direction, profileId })
  }

  trackMatch(matchId, userId) {
    this.trackEvent('match_created', { matchId, userId })
  }

  trackMessage(matchId) {
    this.trackEvent('message_sent', { matchId })
  }

  trackProfileView(profileId) {
    this.trackEvent('profile_viewed', { profileId })
  }

  trackSignup(userId) {
    this.trackEvent('user_signup', { userId })
  }

  trackLogin(userId) {
    this.trackEvent('user_login', { userId })
  }

  // Get user stats
  async getUserStats(userId) {
    try {
      const matches = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID,
        [Query.equal('user1Id', userId)]
      )

      const messages = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID,
        [Query.equal('senderId', userId)]
      )

      return {
        totalMatches: matches.total,
        totalMessages: messages.total,
        responseRate: this.calculateResponseRate(matches, messages)
      }
    } catch (error) {
      console.error('Stats error:', error)
      return null
    }
  }

  calculateResponseRate(matches, messages) {
    if (matches.total === 0) return 0
    const matchesWithMessages = matches.documents.filter(match => 
      messages.documents.some(msg => msg.matchId === match.$id)
    )
    return Math.round((matchesWithMessages.length / matches.total) * 100)
  }
}

export default new Analytics()
