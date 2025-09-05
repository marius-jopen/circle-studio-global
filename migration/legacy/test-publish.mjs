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

async function testPublish() {
  console.log('🔍 Testing document publishing...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  
  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN not found');
    return;
  }

  // First, create a document
  console.log('📝 Creating a test document...');
  const testData = {
    type: 'people',
    uid: 'publish-test-' + Date.now(),
    lang: 'en-us',
    title: 'Publish Test Person',
    data: {
      link: { link_type: 'Any' }
    }
  };

  try {
    const createResponse = await fetch('https://migration.prismic.io/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${writeToken}`,
        'repository': REPOSITORY_NAME,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    if (!createResponse.ok) {
      console.error('❌ Failed to create document:', await createResponse.text());
      return;
    }

    const createdDoc = await createResponse.json();
    console.log('✅ Document created:', createdDoc.id);

    // Try to publish the document
    console.log('📤 Attempting to publish document...');
    const publishResponse = await fetch(`https://migration.prismic.io/documents/${createdDoc.id}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${writeToken}`,
        'repository': REPOSITORY_NAME,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Publish response status:', publishResponse.status);
    const publishText = await publishResponse.text();
    console.log('📥 Publish response body:', publishText);

    if (publishResponse.ok) {
      console.log('✅ Document published successfully!');
      
      // Wait a moment and try to fetch it
      console.log('⏳ Waiting 2 seconds before checking...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to fetch via Content API
      try {
        const fetchResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/${createdDoc.id}`, {
          headers: {
            'Authorization': `Token ${process.env.PRISMIC_ACCESS_TOKEN}`
          }
        });
        
        console.log('📥 Fetch status after publish:', fetchResponse.status);
        if (fetchResponse.ok) {
          const doc = await fetchResponse.json();
          console.log('✅ Document found after publishing:', doc.title);
        } else {
          console.log('❌ Document still not accessible after publishing');
        }
      } catch (fetchError) {
        console.log('❌ Error fetching after publish:', fetchError.message);
      }
    } else {
      console.log('❌ Failed to publish document');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPublish().catch(console.error);
