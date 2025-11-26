import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Save, User, Cake, MapPin, BookOpen, Instagram, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { databases, storage, account, ID } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../hooks/useToast'
import cacheManager from '../lib/cacheManager'

const INTERESTS_OPTIONS = [
  '🎮 Gaming', '📚 Reading', '🎵 Music', '🎬 Movies', '⚽ Sports',
  '🎨 Art', '🍳 Cooking', '✈️ Travel', '📷 Photography', '💪 Fitness',
  '🎭 Theater', '🎸 Guitar', '💻 Coding', '🧘 Yoga', '🏃 Running',
  '🎤 Singing', '🎪 Dancing', '🎲 Board Games', '📖 Writing', '🌱 Nature'
]

export default function ProfileEditScreen() {
  const navigate = useNavigate()
  const { user, userProfile, checkAuth } = useAuthStore()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    age: userProfile?.age || 18,
    bio: userProfile?.bio || '',
    university: userProfile?.university || '',
    interests: userProfile?.interests || [],
    profileImage: null,
    previewUrl: userProfile?.profileImage || null,
    instagramHandle: userProfile?.instagramHandle || '',
    prompts: userProfile?.prompts || [
      { question: 'My go-to study spot is...', answer: '' },
      { question: "You should NOT date me if...", answer: '' },
      { question: "I'm looking for...", answer: '' }
    ]
  })

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({
        ...formData,
        profileImage: file,
        previewUrl: URL.createObjectURL(file)
      })
    }
  }

  const toggleInterest = (interest) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      })
    } else if (formData.interests.length < 5) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        bio: formData.bio.trim(),
        university: formData.university.trim(),
        interests: formData.interests,
        instagramHandle: formData.instagramHandle.trim(),
        prompts: formData.prompts
      }

      // Handle image upload if new image selected
      if (formData.profileImage) {
        try {
          const file = await storage.createFile(
            import.meta.env.VITE_APPWRITE_BUCKET_ID || 'default',
            ID.unique(),
            formData.profileImage
          )
          
          updateData.profileImage = storage.getFileView(
            import.meta.env.VITE_APPWRITE_BUCKET_ID || 'default',
            file.$id
          ).href
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          showToast('Failed to upload image, saving other changes...', 'info')
        }
      } else if (formData.previewUrl) {
        // Keep existing image
        updateData.profileImage = formData.previewUrl
      } else {
        updateData.profileImage = ''
      }

      console.log('Updating profile with:', updateData)

      // Update in Appwrite
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        user.$id,
        updateData
      )

      console.log('✅ Profile updated successfully')

      // Refresh auth state
      await checkAuth()
      
      // Clear cache
      cacheManager.clearAll()
      
      showToast('Profile updated successfully! 🎉', 'success')
      
      // Navigate back
      setTimeout(() => {
        navigate('/profile')
      }, 500)
      
    } catch (error) {
      console.error('❌ Update profile error:', error)
      
      if (error.code === 401) {
        showToast('Session expired. Please login again.', 'error')
        navigate('/login')
      } else if (error.message.includes('Missing required attribute')) {
        showToast('Some required fields are missing', 'error')
      } else {
        showToast(`Update failed: ${error.message}`, 'error')
      }
    }
    
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/profile')}
          className="text-neutral-600 hover:text-neutral-900"
        >
          Cancel
        </button>
        <h1 className="text-xl font-bold text-neutral-900">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-primary-500 font-semibold hover:text-primary-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          <label className="cursor-pointer group">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-dark-100 shadow-xl">
                {formData.previewUrl ? (
                  <img src={formData.previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Tap to change photo</p>
        </div>

        {/* Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="w-4 h-4 text-primary-500" />
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-800 rounded-2xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        {/* Age */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Cake className="w-4 h-4 text-primary-500" />
            Age
          </label>
          <input
            type="number"
            min="18"
            max="100"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
            className="w-full bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-800 rounded-2xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        {/* University */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="w-4 h-4 text-primary-500" />
            University
          </label>
          <input
            type="text"
            value={formData.university}
            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
            className="w-full bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-800 rounded-2xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        {/* Instagram Integration */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            Instagram Handle
          </label>
          <div className="flex gap-2">
            <span className="flex items-center px-3 bg-neutral-100 rounded-l-2xl text-neutral-600">@</span>
            <input
              type="text"
              value={formData.instagramHandle}
              onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
              placeholder="username"
              className="flex-1 bg-white border border-gray-200 rounded-r-2xl py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Connect Instagram to show your latest posts</p>
        </div>

        {/* Profile Prompts */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            Profile Prompts (Answer 3)
          </label>
          <div className="space-y-3">
            {formData.prompts.map((prompt, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">{prompt.question}</p>
                <input
                  type="text"
                  value={prompt.answer}
                  onChange={(e) => {
                    const newPrompts = [...formData.prompts]
                    newPrompts[idx].answer = e.target.value
                    setFormData({ ...formData, prompts: newPrompts })
                  }}
                  placeholder="Your answer..."
                  maxLength={80}
                  className="w-full bg-neutral-50 border-0 rounded-xl py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{prompt.answer.length}/80</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <BookOpen className="w-4 h-4 text-primary-500" />
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell people about yourself..."
            maxLength={200}
            rows={4}
            className="w-full bg-white dark:bg-dark-100 border border-gray-200 dark:border-gray-800 rounded-2xl py-3 px-4 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/200</p>
        </div>

        {/* Interests */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            Interests (Select up to 5)
          </label>
          <p className="text-xs text-primary-500 mb-3">Selected: {formData.interests.length}/5</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {INTERESTS_OPTIONS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                  formData.interests.includes(interest)
                    ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white dark:bg-dark-100 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-primary-500'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-primary-500 to-pink-500 text-white py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
