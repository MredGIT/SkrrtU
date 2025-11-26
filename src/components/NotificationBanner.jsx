import React from 'react'
import { motion } from 'framer-motion'
import { Bell, X } from 'lucide-react'

export default function NotificationBanner({ message, onClose, type = 'info' }) {
  const colors = {
    info: 'from-neon-blue to-neon-purple',
    success: 'from-neon-green to-neon-blue',
    warning: 'from-yellow-500 to-orange-500',
    error: 'from-red-500 to-pink-500'
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r ${colors[type]} rounded-2xl p-4 shadow-2xl z-50`}
    >
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-sm font-semibold">{message}</p>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}
