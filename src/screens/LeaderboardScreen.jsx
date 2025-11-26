import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Crown, Medal } from 'lucide-react'
import { databases, Query } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import Logo from '../components/Logo'

export default function LeaderboardScreen() {
  const { user } = useAuthStore()
  const [leaderboard, setLeaderboard] = useState([])
  const [filter, setFilter] = useState('week') // week, month, all-time
  const [userRank, setUserRank] = useState(null)

  useEffect(() => {
    loadLeaderboard()
  }, [filter])

  const loadLeaderboard = async () => {
    // Simulated leaderboard data
    const mockData = [
      { id: '1', name: 'Emma Davis', matches: 156, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400' },
      { id: '2', name: 'Jake Wilson', matches: 142, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
      { id: '3', name: 'Sophie Chen', matches: 138, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
      { id: '4', name: 'Alex Johnson', matches: 127, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
      { id: '5', name: 'Mia Anderson', matches: 115, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400' },
      { id: '6', name: 'Chris Lee', matches: 98, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400' },
      { id: '7', name: 'Olivia Brown', matches: 87, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400' },
      { id: '8', name: 'Ryan Martinez', matches: 76, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400' },
    ]

    setLeaderboard(mockData)
    setUserRank(Math.floor(Math.random() * 50) + 10) // Random rank for current user
  }

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-500" />
      case 1: return <Medal className="w-6 h-6 text-gray-400" />
      case 2: return <Medal className="w-6 h-6 text-orange-600" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 z-10 px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Logo size="sm" variant="white" />
          <Trophy className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-white/90 text-sm">Most popular on campus this {filter}</p>

        {/* User Rank Card */}
        {userRank && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center font-bold text-white">
                  #{userRank}
                </div>
                <div>
                  <p className="font-semibold text-white">Your Rank</p>
                  <p className="text-xs text-white/80">Keep swiping to climb higher!</p>
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-36 bg-white border-b border-neutral-200 px-4 py-3 z-10">
        <div className="flex gap-2">
          {['week', 'month', 'all-time'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {f.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="px-4 py-4">
        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {leaderboard.slice(0, 3).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`text-center ${index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'}`}
            >
              <div className={`relative mx-auto mb-2 ${index === 0 ? 'w-24 h-24' : 'w-20 h-20'}`}>
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -top-2 -right-2">
                  {getRankIcon(index)}
                </div>
              </div>
              <p className="font-bold text-neutral-900 text-sm truncate">{item.name}</p>
              <p className="text-xs text-neutral-600">{item.matches} matches</p>
            </motion.div>
          ))}
        </div>

        {/* Rest of the list */}
        <div className="space-y-2">
          {leaderboard.slice(3).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 3) * 0.05 }}
              className="flex items-center gap-3 bg-neutral-50 p-3 rounded-2xl hover:bg-neutral-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-700">
                #{index + 4}
              </div>
              <img
                src={item.avatar}
                alt={item.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 truncate">{item.name}</p>
                <p className="text-sm text-neutral-600">{item.matches} matches</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
