import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, ArrowRight, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { storage, databases, ID } from '../lib/appwrite'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../hooks/useToast'
import { compressImage } from '../utils/imageOptimizer'

export default function ProfileSetupScreen() {
  const navigate = useNavigate()
  const { user, checkAuth } = useAuthStore()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    profileImage: '',
    bio: '',
    interests: [],
    university: '',
    age: 18
  })
  
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const interestOptions = [
    'Music', 'Sports', 'Gaming', 'Movies', 'Reading', 'Travel',
    'Food', 'Art', 'Photography', 'Fitness', 'Coding', 'Dance'
  ]

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Basic validation
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be smaller than 10MB', 'error')
      return
    }

    setUploadingImage(true)

    try {
      // Compress image before upload
      const compressedFile = await compressImage(file)
      
      // Upload compressed file
      const uploadedFile = await storage.createFile(
        import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
        ID.unique(),
        compressedFile
      )

      console.log('✅ File uploaded:', uploadedFile.$id)

      // Get file URL
      const fileUrl = storage.getFileView(
        import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
        uploadedFile.$id
      )

      setFormData({ ...formData, profileImage: fileUrl.toString() })
      setImagePreview(URL.createObjectURL(file))
      showToast('Image uploaded! ✅', 'success')
    } catch (error) {
      console.error('Upload error:', error)
      showToast('Upload failed: ' + error.message, 'error')
    }

    setUploadingImage(false)
  }

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.profileImage) {
      setError('Please upload a profile photo')
      return
    }

    if (!formData.bio.trim()) {
      setError('Please add a bio')
      return
    }

    if (formData.interests.length === 0) {
      setError('Please select at least one interest')
      return
    }

    setLoading(true)

    try {
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        user.$id,
        {
          profileImage: formData.profileImage,
          bio: formData.bio.trim(),
          interests: formData.interests,
          university: formData.university.trim() || 'University',
          age: formData.age
        }
      )

      await checkAuth()
      showToast('Profile complete! 🎉', 'success')
      navigate('/home', { replace: true })
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save')
      showToast('Failed to save profile', 'error')
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
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Complete Your Profile</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload */}
            <div className="text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImage || loading}
              />
              <label
                htmlFor="image-upload"
                className="inline-block cursor-pointer"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white/20"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white/10 mx-auto flex items-center justify-center border-4 border-white/20">
                    {uploadingImage ? (
                      <Loader className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-white" />
                    )}
                  </div>
                )}
                <p className="text-white/80 text-sm mt-2">
                  {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                </p>
              </label>
            </div>

            {/* Bio */}
            <textarea
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/60 focus:outline-none focus:border-white/40 resize-none"
              rows={4}
              disabled={loading}
            />

            {/* Interests */}
            <div>
              <label className="text-white font-semibold mb-2 block">Interests</label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      formData.interests.includes(interest)
                        ? 'bg-white text-pink-600'
                        : 'bg-white/10 text-white'
                    }`}
                    disabled={loading}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full bg-white text-pink-600 py-4 rounded-2xl font-bold text-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Profile
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
