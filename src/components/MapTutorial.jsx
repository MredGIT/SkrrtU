import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Users, Heart, X } from 'lucide-react'

export default function MapTutorial({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[2000] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 max-w-md border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold mb-6 neon-text text-center">How the Map Works</h2>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-neon-pink/20 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-neon-pink" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Your Location</h3>
              <p className="text-sm text-gray-400">
                Your pink marker shows where you are on campus. Only visible to students at your university.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-neon-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-neon-blue" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Other Students</h3>
              <p className="text-sm text-gray-400">
                Blue markers are other students online at your university. Tap them to see their profile!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-neon-purple/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-neon-purple" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Like & Match</h3>
              <p className="text-sm text-gray-400">
                Like someone from the map and if they like you back, it's a match!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 bg-gradient-to-r from-neon-pink to-neon-purple py-4 rounded-2xl font-bold hover:scale-105 transition-transform"
        >
          Got it!
        </button>
      </motion.div>
    </motion.div>
  )
}
