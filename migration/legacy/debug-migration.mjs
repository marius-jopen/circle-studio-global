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

async function debugMigration() {
  console.log('🔍 Debugging migration issue...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  
  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN not found');
    return;
  }

  // Test 1: Try to create a document with minimal data
  console.log('\n🧪 Test 1: Minimal document creation');
  try {
    const testData1 = {
      type: 'people',
      uid: 'debug-test-' + Date.now(),
      lang: 'en-us',
      title: 'Debug Test Person',
      data: {}
    };

    console.log('📤 Sending:', JSON.stringify(testData1, null, 2));

    const response1 = await fetch('https://migration.prismic.io/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${writeToken}`,
        'repository': REPOSITORY_NAME,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData1)
    });

    console.log('📥 Response status:', response1.status);
    const responseText1 = await response1.text();
    console.log('📥 Response body:', responseText1);

    if (response1.ok) {
      const result1 = JSON.parse(responseText1);
      console.log('✅ Test 1 succeeded! Document ID:', result1.id);
      
      // Try to fetch it immediately
      console.log('\n🔍 Trying to fetch the created document...');
      try {
        const fetchResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/${result1.id}`, {
          headers: {
            'Authorization': `Token ${process.env.PRISMIC_ACCESS_TOKEN}`
          }
        });
        
        console.log('📥 Fetch status:', fetchResponse.status);
        if (fetchResponse.ok) {
          const doc = await fetchResponse.json();
          console.log('✅ Document found via API:', doc.title);
        } else {
          console.log('❌ Document not found via API');
        }
      } catch (fetchError) {
        console.log('❌ Error fetching document:', fetchError.message);
      }
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Check if content type exists
  console.log('\n🧪 Test 2: Check content type');
  try {
    const typeResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/types`, {
      headers: {
        'Authorization': `Token ${process.env.PRISMIC_ACCESS_TOKEN}`
      }
    });
    
    if (typeResponse.ok) {
      const types = await typeResponse.json();
      console.log('📊 Available content types:', Object.keys(types.types || {}));
      
      if (types.types && types.types.people) {
        console.log('✅ People content type exists');
        console.log('   People type info:', JSON.stringify(types.types.people, null, 2));
      } else {
        console.log('❌ People content type not found');
      }
    } else {
      console.log('❌ Could not fetch content types');
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
}

debugMigration().catch(console.error);
