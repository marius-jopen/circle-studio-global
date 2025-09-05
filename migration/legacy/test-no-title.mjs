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

async function testNoTitle() {
  console.log('🔍 Testing document creation without title field...');
  
  const writeClient = createWriteClient(REPOSITORY_NAME, {
    writeToken: process.env.PRISMIC_WRITE_TOKEN,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  try {
    // Test 1: No title field at all
    console.log('\n🧪 Test 1: No title field');
    try {
      const result1 = await writeClient.createDocument({
        type: 'people',
        uid: 'test-no-title',
        lang: 'en-us',
        data: {
          link: { link_type: 'Any' }
        }
      });
      console.log('✅ Test 1 passed: Document created without title');
      console.log('   Document ID:', result1.id);
    } catch (error) {
      console.log('❌ Test 1 failed:', error.message);
      if (error.response) {
        console.log('   Response:', JSON.stringify(error.response, null, 2));
      }
    }

    // Test 2: Try with different field names
    console.log('\n🧪 Test 2: Different field names');
    try {
      const result2 = await writeClient.createDocument({
        type: 'people',
        uid: 'test-name-field',
        lang: 'en-us',
        data: {
          name: 'Test Name',
          link: { link_type: 'Any' }
        }
      });
      console.log('✅ Test 2 passed: Document created with name field');
      console.log('   Document ID:', result2.id);
    } catch (error) {
      console.log('❌ Test 2 failed:', error.message);
      if (error.response) {
        console.log('   Response:', JSON.stringify(error.response, null, 2));
      }
    }

    // Test 3: Try with empty title
    console.log('\n🧪 Test 3: Empty title');
    try {
      const result3 = await writeClient.createDocument({
        type: 'people',
        uid: 'test-empty-title',
        lang: 'en-us',
        data: {
          title: '',
          link: { link_type: 'Any' }
        }
      });
      console.log('✅ Test 3 passed: Document created with empty title');
      console.log('   Document ID:', result3.id);
    } catch (error) {
      console.log('❌ Test 3 failed:', error.message);
      if (error.response) {
        console.log('   Response:', JSON.stringify(error.response, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNoTitle().catch(console.error);
