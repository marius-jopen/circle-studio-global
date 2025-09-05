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

async function testSupportSolution() {
  console.log('🔍 Testing the exact solution from Prismic support...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  if (!writeToken || !accessToken) {
    console.error('❌ Both PRISMIC_WRITE_TOKEN and PRISMIC_ACCESS_TOKEN are required');
    return;
  }

  // Test the exact format from the support ticket
  const testCases = [
    {
      name: 'Original support ticket format (name in data)',
      data: {
        type: 'people',
        uid: 'support-test-1-' + Date.now(),
        lang: 'en-us',
        data: {
          name: 'Support Test 1',
          link: { link_type: 'Any' }
        }
      }
    },
    {
      name: 'Our current format (title at root)',
      data: {
        type: 'people',
        uid: 'support-test-2-' + Date.now(),
        lang: 'en-us',
        title: 'Support Test 2',
        data: {
          link: { link_type: 'Any' }
        }
      }
    },
    {
      name: 'Both title and name',
      data: {
        type: 'people',
        uid: 'support-test-3-' + Date.now(),
        lang: 'en-us',
        title: 'Support Test 3',
        data: {
          name: 'Support Test 3',
          link: { link_type: 'Any' }
        }
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    
    try {
      const response = await fetch('https://migration.prismic.io/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${writeToken}`,
          'repository': REPOSITORY_NAME,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      });

      console.log('📥 Response status:', response.status);
      const responseText = await response.text();
      console.log('📥 Response body:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        console.log('✅ Document created! ID:', result.id);
        
        // Wait and check if it's visible
        console.log('⏳ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to fetch it
        try {
          const fetchResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/${result.id}`, {
            headers: {
              'Authorization': `Token ${accessToken}`
            }
          });
          
          console.log('📥 Fetch status:', fetchResponse.status);
          if (fetchResponse.ok) {
            const doc = await fetchResponse.json();
            console.log('🎉 SUCCESS! Document is visible!');
            console.log('   Title:', doc.title);
            console.log('   Data:', JSON.stringify(doc.data, null, 2));
            return; // Stop on first success
          } else {
            console.log('❌ Document not visible');
          }
        } catch (fetchError) {
          console.log('❌ Error fetching:', fetchError.message);
        }
      } else {
        console.log('❌ Failed to create document');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

testSupportSolution().catch(console.error);
