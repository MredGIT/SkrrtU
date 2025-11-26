import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-pink-500 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Logo size="xl" variant="white" className="mb-4 drop-shadow-lg" />
        
        <p className="text-xl text-white/90 mb-12 max-w-md mx-auto">
          Connect with students on your campus
        </p>

        <div className="space-y-4 max-w-sm mx-auto">
          <button
            onClick={() => navigate('/signup')}
            className="w-full bg-white text-primary-600 py-4 rounded-full font-bold text-lg hover:bg-neutral-100 transition-all shadow-xl"
          >
            Create Account
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-white/10 backdrop-blur-sm text-white py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all border-2 border-white/30"
          >
            Sign In
          </button>
        </div>
      </motion.div>
    </div>
  )
}
