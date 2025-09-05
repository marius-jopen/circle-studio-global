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

async function testSchemaMatch() {
  console.log('🔍 Testing with exact schema match...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  
  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN not found');
    return;
  }

  // Test with different data structures to match the schema
  const testCases = [
    {
      name: 'Minimal with title only',
      data: {
        type: 'people',
        uid: 'schema-test-1-' + Date.now(),
        lang: 'en-us',
        title: 'Schema Test 1',
        data: {}
      }
    },
    {
      name: 'With title and name field',
      data: {
        type: 'people',
        uid: 'schema-test-2-' + Date.now(),
        lang: 'en-us',
        title: 'Schema Test 2',
        data: {
          name: 'Schema Test 2'
        }
      }
    },
    {
      name: 'With title and link field',
      data: {
        type: 'people',
        uid: 'schema-test-3-' + Date.now(),
        lang: 'en-us',
        title: 'Schema Test 3',
        data: {
          link: { link_type: 'Any' }
        }
      }
    },
    {
      name: 'With all fields',
      data: {
        type: 'people',
        uid: 'schema-test-4-' + Date.now(),
        lang: 'en-us',
        title: 'Schema Test 4',
        data: {
          name: 'Schema Test 4',
          link: { link_type: 'Web', url: 'https://example.com' }
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
        console.log('✅ Success! Document ID:', result.id);
        
        // Try to fetch it immediately
        try {
          const fetchResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/${result.id}`, {
            headers: {
              'Authorization': `Token ${process.env.PRISMIC_ACCESS_TOKEN}`
            }
          });
          
          console.log('📥 Fetch status:', fetchResponse.status);
          if (fetchResponse.ok) {
            const doc = await fetchResponse.json();
            console.log('✅ Document accessible via Content API!');
            console.log('   Title:', doc.title);
            console.log('   Data:', JSON.stringify(doc.data, null, 2));
            break; // Stop on first success
          } else {
            console.log('❌ Document not accessible via Content API');
          }
        } catch (fetchError) {
          console.log('❌ Error fetching document:', fetchError.message);
        }
      } else {
        console.log('❌ Failed to create document');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

testSchemaMatch().catch(console.error);
