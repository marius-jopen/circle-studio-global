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

async function testPublishedDirect() {
  console.log('🔍 Testing direct published document creation...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  
  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN not found');
    return;
  }

  // Test different approaches to create published documents
  const testCases = [
    {
      name: 'With published: true parameter',
      data: {
        type: 'people',
        uid: 'published-test-1-' + Date.now(),
        lang: 'en-us',
        title: 'Published Test 1',
        published: true,
        data: {
          link: { link_type: 'Any' }
        }
      }
    },
    {
      name: 'With status: published parameter',
      data: {
        type: 'people',
        uid: 'published-test-2-' + Date.now(),
        lang: 'en-us',
        title: 'Published Test 2',
        status: 'published',
        data: {
          link: { link_type: 'Any' }
        }
      }
    },
    {
      name: 'With is_published: true parameter',
      data: {
        type: 'people',
        uid: 'published-test-3-' + Date.now(),
        lang: 'en-us',
        title: 'Published Test 3',
        is_published: true,
        data: {
          link: { link_type: 'Any' }
        }
      }
    },
    {
      name: 'With release_id parameter',
      data: {
        type: 'people',
        uid: 'published-test-4-' + Date.now(),
        lang: 'en-us',
        title: 'Published Test 4',
        release_id: 'master',
        data: {
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
        
        // Wait a moment and check if it's visible
        console.log('⏳ Waiting 3 seconds before checking visibility...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to fetch via Content API
        try {
          const fetchResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/${result.id}`, {
            headers: {
              'Authorization': `Token ${process.env.PRISMIC_ACCESS_TOKEN}`
            }
          });
          
          console.log('📥 Content API fetch status:', fetchResponse.status);
          if (fetchResponse.ok) {
            const doc = await fetchResponse.json();
            console.log('🎉 SUCCESS! Document is visible via Content API!');
            console.log('   Title:', doc.title);
            console.log('   Published:', doc.first_publication_date);
            return; // Stop on first success
          } else {
            console.log('❌ Document not visible via Content API');
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

testPublishedDirect().catch(console.error);
