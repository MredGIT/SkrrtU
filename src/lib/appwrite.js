import { Client, Account, Databases, Storage, Query, ID } from 'appwrite'

// Add better error handling for production
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID

if (!ENDPOINT || !PROJECT_ID) {
  console.error('❌ Missing Appwrite configuration!')
  console.error('Please check your environment variables in Vercel')
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)

// Add timeout for better error messages
client.config.timeout = 30000 // 30 seconds

console.log('🔧 Appwrite Configuration:')
console.log('Endpoint:', import.meta.env.VITE_APPWRITE_ENDPOINT)
console.log('Project ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID)
console.log('Database ID:', import.meta.env.VITE_APPWRITE_DATABASE_ID)

const account = new Account(client)
const databases = new Databases(client)
const storage = new Storage(client)

export { client, account, databases, storage, Query, ID }
export default client

// Test function
export async function testConnection() {
  try {
    await account.get()
    console.log('✅ Appwrite connected!')
  } catch (error) {
    if (error.code === 401) {
      console.log('✅ Appwrite connected! (No user session - normal)')
    } else {
      console.error('❌ Connection failed:', error.message)
    }
  }
}
