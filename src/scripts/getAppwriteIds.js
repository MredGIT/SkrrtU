import { Client, Databases } from 'appwrite'

// Replace with YOUR project ID from Settings
const PROJECT_ID = 'YOUR_PROJECT_ID_HERE'
const ENDPOINT = 'https://cloud.appwrite.io/v1'

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)

const databases = new Databases(client)

async function getIds() {
  try {
    console.log('\n🔍 Fetching your Appwrite IDs...\n')
    
    // List all databases
    const databasesList = await databases.list()
    console.log('📁 DATABASES:')
    databasesList.databases.forEach(db => {
      console.log(`   Name: ${db.name}`)
      console.log(`   ID: ${db.$id}`)
      console.log('')
    })

    // Get first database ID (should be skrrtu_db)
    if (databasesList.databases.length > 0) {
      const dbId = databasesList.databases[0].$id
      
      // List all collections
      const collectionsList = await databases.listCollections(dbId)
      console.log('📄 COLLECTIONS:')
      collectionsList.collections.forEach(col => {
        console.log(`   Name: ${col.name}`)
        console.log(`   ID: ${col.$id}`)
        console.log('')
      })
    }

    console.log('\n✅ Copy these IDs to your .env file!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Make sure you replaced YOUR_PROJECT_ID_HERE in the script!')
  }
}

getIds()
