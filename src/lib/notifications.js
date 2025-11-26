class NotificationManager {
  constructor() {
    this.permission = 'default'
  }

  // Request permission for notifications
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
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

  // Show notification
  show(title, options = {}) {
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted')
      return
    }

    const defaultOptions = {
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
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

      return notification
    } catch (error) {
      console.error('Notification error:', error)
    }
  }

  // Notification templates
  newMatch(userName) {
    this.show('New Match! 💕', {
      body: `You and ${userName} liked each other!`,
      url: '/chat'
    })
  }

  newMessage(userName, message) {
    this.show(`${userName}`, {
      body: message,
      url: '/chat'
    })
  }

  newLike() {
    this.show('Someone likes you! 👀', {
      body: 'Upgrade to see who it is',
      url: '/discover'
    })
  }

  dailyReminder() {
    this.show('Come back! 🔥', {
      body: 'New people are waiting to meet you',
      url: '/home'
    })
  }
}

export default new NotificationManager()
