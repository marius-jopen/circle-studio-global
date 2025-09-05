#!/usr/bin/env node

import { createWriteClient } from '@prismicio/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });
config({ path: join(__dirname, '.env') });

const REPOSITORY_NAME = 'circle-studio-global';

async function testAccess() {
  console.log('🔍 Testing Prismic access...');
  
  // Validate environment
  if (!process.env.PRISMIC_WRITE_TOKEN) {
    console.error('❌ PRISMIC_WRITE_TOKEN is required');
    process.exit(1);
  }
  
  if (!process.env.PRISMIC_ACCESS_TOKEN) {
    console.warn('⚠️  PRISMIC_ACCESS_TOKEN not found');
  }

  // Initialize Prismic client
  const writeClient = createWriteClient(REPOSITORY_NAME, {
    writeToken: process.env.PRISMIC_WRITE_TOKEN,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  try {
    console.log('📡 Testing basic connection...');
    
    // Test 1: Try to create a simple document with minimal data
    console.log('\n🧪 Test 1: Minimal document creation');
    try {
      const result1 = await writeClient.createDocument({
        type: 'people',
        uid: 'test-minimal',
        lang: 'en-us',
        data: {
          title: 'Test Person'
        }
      });
      console.log('✅ Test 1 passed: Minimal document created');
      console.log('   Document ID:', result1.id);
    } catch (error) {
      console.log('❌ Test 1 failed:', error.message);
      if (error.response) {
        console.log('   Response:', JSON.stringify(error.response, null, 2));
      }
    }

    // Test 2: Try with title and link
    console.log('\n🧪 Test 2: Document with title and link');
    try {
      const result2 = await writeClient.createDocument({
        type: 'people',
        uid: 'test-with-link',
        lang: 'en-us',
        data: {
          title: 'Test Person 2',
          link: {
            link_type: 'Web',
            url: 'https://example.com'
          }
        }
      });
      console.log('✅ Test 2 passed: Document with link created');
      console.log('   Document ID:', result2.id);
    } catch (error) {
      console.log('❌ Test 2 failed:', error.message);
      if (error.response) {
        console.log('   Response:', JSON.stringify(error.response, null, 2));
      }
    }

    // Test 3: Try with different title formats
    console.log('\n🧪 Test 3: Different title formats');
    
    // Test 3a: String title
    try {
      const result3a = await writeClient.createDocument({
        type: 'people',
        uid: 'test-string-title',
        lang: 'en-us',
        data: {
          title: 'String Title',
          link: { link_type: 'Any' }
        }
      });
      console.log('✅ Test 3a passed: String title works');
    } catch (error) {
      console.log('❌ Test 3a failed (String title):', error.message);
    }

    // Test 3b: RichText title
    try {
      const result3b = await writeClient.createDocument({
        type: 'people',
        uid: 'test-richtext-title',
        lang: 'en-us',
        data: {
          title: [{ type: 'heading1', text: 'RichText Title' }],
          link: { link_type: 'Any' }
        }
      });
      console.log('✅ Test 3b passed: RichText title works');
    } catch (error) {
      console.log('❌ Test 3b failed (RichText title):', error.message);
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testAccess().catch(console.error);
