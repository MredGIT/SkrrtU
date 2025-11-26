import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { account } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../hooks/useToast'
import { CheckCircle, Mail, Loader } from 'lucide-react'

export default function EmailVerificationScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { checkAuth } = useAuthStore()
  const { showToast } = useToast()
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const userId = searchParams.get('userId')
    const secret = searchParams.get('secret')

    if (userId && secret) {
      verifyEmail(userId, secret)
    } else {
      setVerifying(false)
      setError('Invalid verification link')
    }
  }, [searchParams])

  const verifyEmail = async (userId, secret) => {
    try {
      // Confirm email verification
      await account.updateVerification(userId, secret)

      await checkAuth()
      
      setVerified(true)
      showToast('Email verified successfully! 🎉', 'success')
      
      setTimeout(() => {
        navigate('/onboarding', { replace: true })
      }, 2000)
      
    } catch (err) {
      console.error('Verification error:', err)
      setError(err.message || 'Verification failed')
      showToast('Verification failed', 'error')
    }
    
    setVerifying(false)
  }

  const resendVerification = async () => {
    try {
      const verificationUrl = `${window.location.origin}/verify`
      await account.createVerification(verificationUrl)
      showToast('Verification email sent! 📧', 'success')
    } catch (err) {
      showToast('Failed to resend email', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center"
      >
        {verifying && (
          <>
            <Loader className="w-16 h-16 text-white mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">Verifying your email...</h2>
            <p className="text-white/80">Please wait</p>
          </>
        )}

        {!verifying && verified && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified! 🎉</h2>
            <p className="text-white/80">Redirecting you to complete your profile...</p>
          </>
        )}

        {!verifying && !verified && error && (
          <>
            <Mail className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-white/80 mb-6">{error}</p>
            
            <button
              onClick={resendVerification}
              className="w-full bg-white text-pink-600 py-3 rounded-2xl font-bold hover:bg-white/90 transition-colors"
            >
              Resend Verification Email
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
