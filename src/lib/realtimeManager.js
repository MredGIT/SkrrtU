import { client } from './appwrite'

class RealtimeManager {
  constructor() {
    this.subscriptions = new Map()
    this.connectionStatus = 'disconnected'
  }

  subscribe(channel, callback, options = {}) {
    // Prevent duplicate subscriptions - THIS IS KEY
    if (this.subscriptions.has(channel)) {
      console.log(`⚠️ Already subscribed to ${channel}, skipping`)
      return () => {} // Return no-op unsubscribe
    }

    try {
      const unsubscribe = client.subscribe(channel, callback)
      this.subscriptions.set(channel, unsubscribe)
      this.connectionStatus = 'connected'
      console.log(`✅ Subscribed to ${channel}`)
      return unsubscribe
    } catch (error) {
      console.error(`❌ Subscribe error:`, error)
      return () => {}
    }
  }

  unsubscribe(channel) {
    const unsubscribe = this.subscriptions.get(channel)
    if (unsubscribe) {
      unsubscribe()
      this.subscriptions.delete(channel)
      console.log(`🔌 Unsubscribed from ${channel}`)
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((unsubscribe, channel) => {
      try {
        unsubscribe()
        console.log(`🔌 Unsubscribed from ${channel}`)
      } catch (e) {
        // Ignore errors during cleanup
      }
    })
    this.subscriptions.clear()
    this.connectionStatus = 'disconnected'
  }
}

export default new RealtimeManager()
