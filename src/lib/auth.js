import { account, databases, ID } from './appwrite'

export async function login(email, password) {
  try {
    // Create session
    await account.createEmailPasswordSession(email, password)
    
    // Get account info
    const user = await account.get()
    
    return { success: true, user }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: error.message }
  }
}

export async function signup(email, password, name) {
  try {
    // Create account
    const user = await account.create(ID.unique(), email, password, name)
    
    // Auto login after signup
    await account.createEmailPasswordSession(email, password)
    
    // Create user profile in database
    await databases.createDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
      user.$id,
      {
        name: name,
        email: email,
        profileImage: '',
        bio: '',
        interests: [],
        university: '',
        age: 18
      }
    )
    
    return { success: true, user }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: error.message }
  }
}

export async function logout() {
  try {
    await account.deleteSession('current')
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: error.message }
  }
}
