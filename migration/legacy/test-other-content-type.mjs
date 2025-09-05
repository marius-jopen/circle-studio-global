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

async function testOtherContentType() {
  console.log('🔍 Testing with different content type...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  
  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN not found');
    return;
  }

  // Try creating a "page" document (which should exist)
  const testData = {
    type: 'page',
    uid: 'test-page-' + Date.now(),
    lang: 'en-us',
    title: 'Test Page',
    data: {
      title: [{ type: 'heading1', text: 'Test Page Title' }]
    }
  };

  try {
    const response = await fetch('https://migration.prismic.io/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${writeToken}`,
        'repository': REPOSITORY_NAME,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Page creation status:', response.status);
    const responseText = await response.text();
    console.log('📥 Page creation response:', responseText);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Page document created! ID:', result.id);
      
      // Wait and check if it's visible
      console.log('⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try to fetch it
      try {
        const fetchResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/${result.id}`, {
          headers: {
            'Authorization': `Token ${process.env.PRISMIC_ACCESS_TOKEN}`
          }
        });
        
        console.log('📥 Page fetch status:', fetchResponse.status);
        if (fetchResponse.ok) {
          const doc = await fetchResponse.json();
          console.log('🎉 SUCCESS! Page document is visible!');
          console.log('   Title:', doc.title);
        } else {
          console.log('❌ Page document not visible');
        }
      } catch (fetchError) {
        console.log('❌ Error fetching page:', fetchError.message);
      }
    } else {
      console.log('❌ Failed to create page document');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOtherContentType().catch(console.error);
