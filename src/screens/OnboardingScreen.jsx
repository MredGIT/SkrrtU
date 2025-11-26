import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Calendar, Shield, ChevronRight, Check, Bell, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import notificationManager from '../lib/notificationManager'

export default function OnboardingScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: Heart,
      title: 'Welcome to SkrrtU!',
      description: 'The #1 way to meet students on your campus. Find friends, study buddies, or that special someone.',
      color: 'from-pink-500 to-red-500',
      emoji: '👋'
    },
    {
      icon: MessageCircle,
      title: 'How It Works',
      description: 'Swipe right to like, left to pass. When you both like each other, you can start chatting!',
      color: 'from-blue-500 to-cyan-500',
      emoji: '💬',
      demo: 'swipe'
    },
    {
      icon: Calendar,
      title: 'Join Events',
      description: 'Create or join campus hangouts. Study groups, parties, sports - connect in real life!',
      color: 'from-purple-500 to-pink-500',
      emoji: '🎉'
    },
    {
      icon: Bell,
      title: 'Enable Notifications',
      description: "Get notified when you have a new match or message. You won't miss anything!",
      color: 'from-orange-500 to-red-500',
      emoji: '🔔',
      action: 'notifications'
    },
    {
      icon: Shield,
      title: 'Stay Safe',
      description: 'Meet in public places, trust your instincts, and report any suspicious behavior. Your safety is our priority.',
      color: 'from-green-500 to-emerald-500',
      emoji: '🛡️'
    }
  ]

  const step = steps[currentStep]
  const Icon = step.icon

  const handleNext = async () => {
    // Handle special actions
    if (step.action === 'notifications') {
      await notificationManager.requestPermission()
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Save that user has completed onboarding
      if (user) {
        localStorage.setItem(`onboarding_${user.$id}`, 'true')
      }
      navigate('/profile-setup', { replace: true })
    }
  }

  const handleSkip = () => {
    if (user) {
      localStorage.setItem(`onboarding_${user.$id}`, 'true')
    }
    navigate('/profile-setup', { replace: true })
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${step.color} flex flex-col items-center justify-center p-4 transition-all duration-500`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="w-full max-w-md"
        >
          {/* Animation */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: currentStep === 1 ? [0, 10, -10, 0] : 0
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-8xl text-center mb-8"
          >
            {step.emoji}
          </motion.div>

          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center mx-auto mb-6">
            <Icon className="w-10 h-10 text-white" />
          </div>

          {/* Content */}
          <h1 className="text-4xl font-bold text-white text-center mb-4">
            {step.title}
          </h1>
          <p className="text-lg text-white/90 text-center mb-12 px-4">
            {step.description}
          </p>

          {/* Swipe Demo */}
          {step.demo === 'swipe' && (
            <div className="mb-8 flex justify-center gap-4">
              <motion.div
                animate={{ x: [-10, 10, -10] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-24 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center"
              >
                <span className="text-4xl">👈</span>
              </motion.div>
              <motion.div
                animate={{ x: [10, -10, 10] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-24 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center"
              >
                <span className="text-4xl">👉</span>
              </motion.div>
            </div>
          )}

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, idx) => (
              <motion.div
                key={idx}
                animate={{
                  width: idx === currentStep ? 32 : 8,
                  backgroundColor: idx <= currentStep ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.4)'
                }}
                className="h-2 rounded-full transition-all"
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {currentStep < steps.length - 1 ? (
              <>
                <button
                  onClick={handleSkip}
                  className="flex-1 bg-white/10 backdrop-blur-lg text-white py-4 rounded-full font-bold hover:bg-white/20 transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-white text-pink-600 py-4 rounded-full font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className="w-full bg-white text-pink-600 py-4 rounded-full font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl"
              >
                Get Started
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
