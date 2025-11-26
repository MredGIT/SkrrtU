import { create } from 'zustand'
import { account, databases } from '../lib/appwrite'

export const useAuthStore = create((set, get) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  isChecking: false,

  checkAuth: async () => {
    // Prevent multiple simultaneous calls
    const state = get()
    if (state.isChecking) {
      console.log('⏳ Auth check already in progress...')
      return
    }
    
    set({ isChecking: true, isLoading: true })
    
    try {
      console.log('🔍 Checking auth...')
      const user = await account.get()
      console.log('✅ User logged in:', user.email)

      // Get user profile
      try {
        const profile = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
          user.$id
        )
        
        console.log('✅ Profile loaded')
        set({ 
          user, 
          userProfile: profile, 
          isLoading: false,
          isChecking: false 
        })
      } catch (profileError) {
        console.log('⚠️ Profile not found, needs setup')
        set({ 
          user, 
          userProfile: null, 
          isLoading: false,
          isChecking: false 
        })
      }
    } catch (error) {
      console.log('❌ Not logged in')
      set({ 
        user: null, 
        userProfile: null, 
        isLoading: false,
        isChecking: false 
      })
    }
  },

  logout: async () => {
    try {
      await account.deleteSession('current')
      set({ user: null, userProfile: null, isLoading: false })
      console.log('✅ Logged out')
    } catch (error) {
      console.error('Logout error:', error)
      // Force clear state even if API call fails
      set({ user: null, userProfile: null, isLoading: false })
    }
  }
}))
