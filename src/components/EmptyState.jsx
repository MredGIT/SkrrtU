import React from 'react'
import { motion } from 'framer-motion'

export default function EmptyState({ icon, title, description, action, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-7xl mb-6"
      >
        {icon}
      </motion.div>
      
      <h3 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 mb-6 max-w-sm">{description}</p>
      
      {action && onAction && (
        <button
          onClick={onAction}
          className="bg-primary-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-600 hover:scale-105 transition-all shadow-lg"
        >
          {action}
        </button>
      )}
    </motion.div>
  )
}
