import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import analytics from './lib/analytics'
import notifications from './lib/notifications'

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered:', registration)
      })
      .catch((error) => {
        console.log('❌ SW registration failed:', error)
      })
  })
}

// Request notification permission on app start
if ('Notification' in window && Notification.permission === 'default') {
  setTimeout(() => {
    Notification.requestPermission()
  }, 5000)
}

// Track app launch
analytics.trackEvent('app_launched')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Add Google Analytics (optional)
if (import.meta.env.PROD) {
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(){dataLayer.push(arguments)}
  gtag('js', new Date())
  gtag('config', 'G-XXXXXXXXXX')
}
