class CacheManager {
  constructor() {
    this.CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
    this.PROFILE_CACHE_KEY = 'skrrtu_profiles'
    this.USER_CACHE_KEY = 'skrrtu_user'
    this.MATCHES_CACHE_KEY = 'skrrtu_matches'
    this.imageCache = new Map() // In-memory image cache
  }

  // Set item with expiry
  set(key, data, expiryMs = this.CACHE_DURATION) {
    const item = {
      data: data,
      expiry: Date.now() + expiryMs,
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(item))
      console.log(`✅ Cached: ${key}`)
    } catch (error) {
      console.error('Cache error:', error)
      // If quota exceeded, clear old items
      this.clearExpired()
    }
  }

  // Get item if not expired
  get(key) {
    try {
      const itemStr = localStorage.getItem(key)
      if (!itemStr) return null

      const item = JSON.parse(itemStr)
      
      // Check if expired
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key)
        console.log(`⏰ Cache expired: ${key}`)
        return null
      }

      console.log(`✅ Cache hit: ${key}`)
      return item.data
    } catch (error) {
      console.error('Cache read error:', error)
      return null
    }
  }

  // Optimize image preloading
  preloadImages(urls) {
    urls.forEach(url => {
      if (this.imageCache.has(url)) return // Already cached
      
      const img = new Image()
      img.src = url
      
      img.onload = () => {
        this.imageCache.set(url, true)
        console.log(`✅ Preloaded: ${url.substring(0, 50)}...`)
      }
      
      img.onerror = () => {
        console.log(`❌ Failed to preload: ${url.substring(0, 50)}...`)
      }
    })
  }

  // Clear expired items more efficiently
  clearExpired() {
    const now = Date.now()
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith('skrrtu_')) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const parsed = JSON.parse(item)
            if (parsed.expiry && now > parsed.expiry) {
              localStorage.removeItem(key)
            }
          }
        } catch (e) {
          // Invalid item, remove it
          localStorage.removeItem(key)
        }
      }
    })
  }

  // Clear all cache
  clearAll() {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('skrrtu_')) {
        localStorage.removeItem(key)
      }
    })
    console.log('🗑️ All cache cleared')
  }
}

export default new CacheManager()
