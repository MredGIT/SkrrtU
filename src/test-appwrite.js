import { account } from './lib/appwrite'

export async function testAppwriteConnection() {
  try {
    const response = await account.get()
    console.log('✅ Appwrite connected!', response)
    return true
  } catch (error) {
    if (error.code === 401) {
      console.log('✅ Appwrite connected! (No user logged in yet, which is normal)')
      return true
    }
    console.error('❌ Appwrite connection failed:', error)
    return false
  }
}
