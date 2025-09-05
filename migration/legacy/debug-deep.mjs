#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });
config({ path: join(__dirname, '.env') });

const REPOSITORY_NAME = 'circle-studio-global';

async function debugDeep() {
  console.log('🔍 Deep debugging of Migration API...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  
  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN not found');
    return;
  }

  // Test 1: Create a document and immediately check if it exists
  console.log('\n🧪 Test 1: Create and immediately check document');
  
  const testData = {
    type: 'people',
    uid: 'debug-deep-' + Date.now(),
    lang: 'en-us',
    title: 'Debug Deep Test',
    data: {
      link: { link_type: 'Any' }
    }
  };

  try {
    // Create document
    const createResponse = await fetch('https://migration.prismic.io/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${writeToken}`,
        'repository': REPOSITORY_NAME,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Create response status:', createResponse.status);
    const createText = await createResponse.text();
    console.log('📥 Create response body:', createText);

    if (createResponse.ok) {
      const createdDoc = JSON.parse(createText);
      console.log('✅ Document created with ID:', createdDoc.id);
      
      // Immediately try to fetch it via different methods
      console.log('\n🔍 Trying to fetch the document...');
      
      // Method 1: Direct API call
      try {
        const fetchResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/${createdDoc.id}`, {
          headers: {
            'Authorization': `Token ${process.env.PRISMIC_ACCESS_TOKEN}`
          }
        });
        console.log('📥 Direct fetch status:', fetchResponse.status);
        if (fetchResponse.ok) {
          const doc = await fetchResponse.json();
          console.log('✅ Document found via direct API!');
          console.log('   Title:', doc.title);
        } else {
          console.log('❌ Document not found via direct API');
        }
      } catch (error) {
        console.log('❌ Error with direct fetch:', error.message);
      }

      // Method 2: Check if it's in a migration release
      console.log('\n🔍 Checking migration release...');
      try {
        const releaseResponse = await fetch(`https://migration.prismic.io/releases`, {
          headers: {
            'Authorization': `Bearer ${writeToken}`,
            'repository': REPOSITORY_NAME
          }
        });
        
        console.log('📥 Release check status:', releaseResponse.status);
        if (releaseResponse.ok) {
          const releases = await releaseResponse.json();
          console.log('📊 Found releases:', releases);
        } else {
          console.log('❌ Could not fetch releases');
        }
      } catch (error) {
        console.log('❌ Error checking releases:', error.message);
      }

      // Method 3: Try to get all documents of this type
      console.log('\n🔍 Checking all people documents...');
      try {
        const allResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/search?ref=master&q=[[at(document.type,"people")]]`, {
          headers: {
            'Authorization': `Token ${process.env.PRISMIC_ACCESS_TOKEN}`
          }
        });
        
        console.log('📥 All people search status:', allResponse.status);
        if (allResponse.ok) {
          const searchResult = await allResponse.json();
          console.log('📊 Found people documents:', searchResult.results?.length || 0);
          if (searchResult.results && searchResult.results.length > 0) {
            searchResult.results.forEach((doc, index) => {
              console.log(`   ${index + 1}. ${doc.title} (${doc.uid}) - ID: ${doc.id}`);
            });
          }
        } else {
          console.log('❌ Could not search for people documents');
        }
      } catch (error) {
        console.log('❌ Error searching for people:', error.message);
      }

    } else {
      console.log('❌ Failed to create document');
    }

  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

debugDeep().catch(console.error);
