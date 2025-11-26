import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { account, databases, ID } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../hooks/useToast'

export default function SignupScreen() {
  const navigate = useNavigate()
  const { checkAuth } = useAuthStore()
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  const universityDomains = [
    '@anu.edu.au',
    '@students.anu.edu.au',
    '@unimelb.edu.au',
    '@student.unimelb.edu.au',
    '@unsw.edu.au',
    '@student.unsw.edu.au',
    // Add more universities
  ]

  const validateUniversityEmail = (email) => {
    return universityDomains.some(domain => email.toLowerCase().endsWith(domain.toLowerCase()))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate university email
    if (!validateUniversityEmail(formData.email)) {
      setError('Please use your university email address (.edu)')
      return
    }

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!formData.email.trim()) {
      setError('Please enter your email')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      console.log('🔄 Creating account...')
      
      // Step 1: Create account
      const userId = ID.unique()
      await account.create(
        userId,
        formData.email.trim(),
        formData.password,
        formData.name.trim()
      )
      
      console.log('✅ Account created:', userId)

      // Step 2: Auto login
      await account.createEmailPasswordSession(
        formData.email.trim(),
        formData.password
      )
      
      console.log('✅ Session created')

      // Step 3: Send verification email
      try {
        const verificationUrl = `${window.location.origin}/verify`
        await account.createVerification(verificationUrl)
        console.log('✅ Verification email sent')
        setVerificationSent(true)
      } catch (verifyError) {
        console.error('⚠️ Failed to send verification:', verifyError)
        // Continue anyway
      }

      // Step 4: Create user profile (WITHOUT emailVerified for now)
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        userId,
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          profileImage: '',
          bio: '',
          interests: [],
          university: '',
          age: 18,
          instagramHandle: '',
          prompts: []
          // emailVerified: false // REMOVE THIS LINE
        }
      )

      console.log('✅ Profile created')

      // Step 5: Update auth store
      await checkAuth()
      
      showToast('Check your email to verify your account! 📧', 'success')
      
      // Navigate to onboarding
      setTimeout(() => {
        navigate('/onboarding', { replace: true })
      }, 500)
      
    } catch (err) {
      console.error('❌ Signup error:', err)
      
      // Better error messages
      if (err.message.includes('user') && err.message.includes('already exists')) {
        setError('This email is already registered. Try logging in instead.')
      } else if (err.message.includes('Invalid email')) {
        setError('Please enter a valid email address')
      } else if (err.message.includes('password')) {
        setError('Password is too weak. Use at least 8 characters.')
      } else {
        setError(err.message || 'Signup failed. Please try again.')
      }
      
      showToast('Signup failed. Please try again.', 'error')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">SkrrtU</h1>
          <p className="text-white/90">Create your account</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-200 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/60 focus:outline-none focus:border-white/40 backdrop-blur-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/60 focus:outline-none focus:border-white/40 backdrop-blur-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-white/60 focus:outline-none focus:border-white/40 backdrop-blur-sm"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/60 focus:outline-none focus:border-white/40 backdrop-blur-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-pink-600 py-4 rounded-2xl font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-pink-600 border-t-transparent"></div>
                  Creating account...
                </>
              ) : (
                <>
                  Sign Up
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                disabled={loading}
                className="text-white font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
