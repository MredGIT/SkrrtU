import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, LogOut, MapPin, Edit3, Settings, Heart, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Logo from '../components/Logo'
import ConfirmDialog from '../components/ConfirmDialog'

export default function ProfileScreen() {
  const navigate = useNavigate()
  const { user, userProfile, logout } = useAuthStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)

  useEffect(() => {
    checkLocationPermission()
  }, [])

  const checkLocationPermission = () => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationEnabled(result.state === 'granted')
      })
    }
  }

  const enableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true)
          alert('Location enabled! You can now be seen on the map.')
        },
        (error) => {
          alert('Please enable location permissions in your browser settings.')
        }
      )
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Clear all cache
      localStorage.clear()
      sessionStorage.clear()
      // Force reload to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const stats = [
    { label: 'Matches', value: '12', icon: Heart },
    { label: 'Messages', value: '8', icon: MessageCircle },
  ]

  // Calculate profile completion
  const profileCompletion = () => {
    let score = 0
    if (userProfile?.profileImage) score += 25
    if (userProfile?.bio) score += 25
    if (userProfile?.interests?.length > 0) score += 25
    if (userProfile?.university) score += 25
    return score
  }

  const completion = profileCompletion()
  const isIncomplete = completion < 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4">
        <div className="flex items-center justify-between">
          <Logo size="md" variant="gradient" />
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Completion Banner */}
        {isIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 bg-orange-500 rounded-2xl p-4 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">Complete Your Profile</span>
              <span className="text-sm">{completion}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mb-3">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <button
              onClick={() => navigate('/profile/edit')}
              className="text-sm underline"
            >
              Complete now to get more matches &rarr;
            </button>
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-100 rounded-3xl shadow-xl overflow-hidden mb-6"
        >
          {/* Profile Image */}
          <div className="relative h-80">
            <img
              src={userProfile?.profileImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600'}
              alt={userProfile?.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Edit Button */}
            <button
              onClick={() => navigate('/profile/edit')}
              className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Edit3 className="w-5 h-5 text-white" />
            </button>

            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-3xl font-bold mb-1">{userProfile?.name || user?.name}, {userProfile?.age || 18}</h2>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="w-4 h-4" />
                <span>{userProfile?.university || 'University'}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 border-b border-gray-200 dark:border-gray-800">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`text-center py-6 ${idx === 0 ? 'border-r border-gray-200 dark:border-gray-800' : ''}`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-5 h-5 text-primary-500" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          {userProfile?.bio && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About</h3>
              <p className="text-gray-600 dark:text-gray-400">{userProfile.bio}</p>
            </div>
          )}

          {/* Interests */}
          {userProfile?.interests && userProfile.interests.length > 0 && (
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {userProfile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-gradient-to-r from-primary-500/10 to-pink-500/10 border border-primary-500/20 rounded-full text-sm font-medium text-primary-600 dark:text-primary-400"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/profile/edit')}
            className="w-full bg-gradient-to-r from-primary-500 to-pink-500 text-white py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
          >
            Edit Profile
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl hover:bg-red-50 transition-colors"
          >
            <span className="font-semibold text-red-600">Log Out</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Log Out?"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        danger={true}
      />
    </div>
  )
}
