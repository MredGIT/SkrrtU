class NotificationManager {
  constructor() {
    this.permission = 'default'
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted'
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    }

    return false
  }

  show(title, options = {}) {
    if (this.permission !== 'granted') return

    const defaultOptions = {
      icon: '/logo-192.png',
      badge: '/logo-192.png',
      vibrate: [200, 100, 200],
      tag: 'skrrtu-notification',
      requireInteraction: false,
      ...options
    }

    try {
      const notification = new Notification(title, defaultOptions)
      
      notification.onclick = () => {
        window.focus()
        if (options.url) {
          window.location.href = options.url
        }
        notification.close()
      }

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)

      return notification
    } catch (error) {
      console.error('Notification error:', error)
    }
  }

  // Specific notification types
  newMatch(userName) {
    this.show('New Match! 💕', {
      body: `You and ${userName} liked each other!`,
      url: '/chat',
      tag: 'new-match'
    })
  }

  newMessage(userName, message) {
    this.show(userName, {
      body: message,
      url: '/chat',
      tag: `message-${userName}`
    })
  }

  eventReminder(eventTitle, time) {
    this.show('Event Reminder 📅', {
      body: `${eventTitle} starts in ${time}`,
      url: '/events',
      tag: 'event-reminder'
    })
  }
}

export default new NotificationManager()
