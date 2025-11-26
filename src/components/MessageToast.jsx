import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function MessageToast({ message, sender, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-dark-100 rounded-2xl shadow-2xl p-4 z-50 border border-gray-200 dark:border-gray-800"
      >
        <div className="flex items-start gap-3">
          <img
            src={sender.profileImage}
            alt={sender.name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
              {sender.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
