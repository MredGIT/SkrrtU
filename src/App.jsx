import React, { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from './store/authStore'
import { useToast } from './hooks/useToast'

// Regular imports
import SplashScreen from './screens/SplashScreen'
import LandingPage from './screens/LandingPage'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import ProfileSetupScreen from './screens/ProfileSetupScreen'
import HomeScreen from './screens/HomeScreen'
import DiscoverScreen from './screens/DiscoverScreen'
import ChatListScreen from './screens/ChatListScreen'
import ChatScreen from './screens/ChatScreen'
import ProfileScreen from './screens/ProfileScreen'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import PWAInstall from './components/PWAInstall'
import OnboardingScreen from './screens/OnboardingScreen'
import EmailVerificationScreen from './screens/EmailVerificationScreen'
import ConnectionStatus from './components/ConnectionStatus'

// Lazy load heavy screens
const EventsScreen = lazy(() => import('./screens/EventsScreen'))
const LeaderboardScreen = lazy(() => import('./screens/LeaderboardScreen'))
const ProfileEditScreen = lazy(() => import('./screens/ProfileEditScreen'))

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppContent />
    </Router>
  )
}

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userProfile, isLoading, checkAuth } = useAuthStore()
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        await checkAuth()
        
        // Wait a bit for smooth transition
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (!mounted) return
        
        setShowSplash(false)
        
        // Check onboarding after splash
        if (user && userProfile) {
          const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.$id}`)
          
          if (!hasSeenOnboarding) {
            const isNewUser = checkIfNewUser(userProfile.$createdAt)
            if (isNewUser) {
              setShowOnboarding(true)
            }
          }
        }
      } catch (error) {
        console.error('Init auth error:', error)
        if (mounted) {
          setShowSplash(false)
        }
      }
    }
    
    initAuth()

    return () => {
      mounted = false
    }
  }, []) // Run only once on mount

  const checkIfNewUser = (createdAt) => {
    // If no createdAt, assume NOT new (to be safe)
    if (!createdAt) {
      console.log('No $createdAt found, skipping onboarding')
      return false
    }
    
    try {
      const created = new Date(createdAt)
      const now = new Date()
      const hoursSinceCreation = (now - created) / (1000 * 60 * 60)
      
      // Show onboarding only if account is less than 1 hour old
      return hoursSinceCreation < 1
    } catch (error) {
      console.error('Date parse error:', error)
      return false
    }
  }

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_${user.$id}`, 'true')
    }
    setShowOnboarding(false)
  }

  // Check if profile needs setup
  const needsProfileSetup = user && userProfile && (
    !userProfile.profileImage || 
    !userProfile.bio || 
    !userProfile.interests || 
    userProfile.interests.length === 0
  )

  // Redirect to profile setup if incomplete
  useEffect(() => {
    if (needsProfileSetup && location.pathname !== '/profile-setup' && location.pathname !== '/onboarding' && location.pathname !== '/verify') {
      navigate('/profile-setup', { replace: true })
    }
  }, [needsProfileSetup, location.pathname, navigate])

  // Show bottom nav on these routes only
  const showBottomNav = user && ['/home', '/discover', '/events', '/chat', '/profile'].includes(location.pathname)

  if (showSplash || isLoading) {
    return <SplashScreen />
  }

  if (showOnboarding && user && !showSplash) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />
  }

  return (
    <>
      <ConnectionStatus />
      <AnimatePresence mode="wait">
        <Suspense fallback={
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div>
          </div>
        }>
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/home" replace />} />
            <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/home" replace />} />
            <Route path="/signup" element={!user ? <SignupScreen /> : <Navigate to="/home" replace />} />
            <Route path="/verify" element={<EmailVerificationScreen />} />
            
            {/* Protected Routes */}
            <Route path="/onboarding" element={user ? <OnboardingScreen onComplete={handleOnboardingComplete} /> : <Navigate to="/login" replace />} />
            <Route path="/profile-setup" element={user ? <ProfileSetupScreen /> : <Navigate to="/login" replace />} />
            <Route path="/home" element={user ? <HomeScreen /> : <Navigate to="/login" replace />} />
            <Route path="/discover" element={user ? <DiscoverScreen /> : <Navigate to="/login" replace />} />
            <Route path="/events" element={user ? <EventsScreen /> : <Navigate to="/login" replace />} />
            <Route path="/leaderboard" element={user ? <LeaderboardScreen /> : <Navigate to="/login" replace />} />
            <Route path="/chat" element={user ? <ChatListScreen /> : <Navigate to="/login" replace />} />
            <Route path="/chat/:matchId" element={user ? <ChatScreen /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={user ? <ProfileScreen /> : <Navigate to="/login" replace />} />
            <Route path="/profile/edit" element={user ? <ProfileEditScreen /> : <Navigate to="/login" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<Navigate to={user ? "/home" : "/"} replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
      
      {showBottomNav && <BottomNav />}
      <PWAInstall />
      
      {/* Toast Notifications */}
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </>
  )
}

export default App
