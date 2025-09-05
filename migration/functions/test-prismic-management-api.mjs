#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '../.env') });
config({ path: join(__dirname, '.env') });

const REPOSITORY_NAME = 'circle-studio-global';

async function testPrismicManagementAPI() {
  console.log('🧪 Testing Prismic Management API');
  console.log('==================================\n');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  
  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN is required');
    return;
  }

  try {
    // Test different API endpoints and formats
    console.log('🔍 Testing different API endpoints...\n');

    // Test 1: Prismic Management API v2
    console.log('1. Testing Prismic Management API v2...');
    try {
      const response1 = await fetch(
        `https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/aH_IwxEAAB8AC1dO`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Token ${writeToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`   Status: ${response1.status} ${response1.statusText}`);
      if (!response1.ok) {
        const errorText = await response1.text();
        console.log(`   Error: ${errorText}`);
      } else {
        console.log('   ✅ Success!');
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }

    // Test 2: Prismic Management API v1
    console.log('\n2. Testing Prismic Management API v1...');
    try {
      const response2 = await fetch(
        `https://${REPOSITORY_NAME}.prismic.io/api/documents/aH_IwxEAAB8AC1dO`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Token ${writeToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`   Status: ${response2.status} ${response2.statusText}`);
      if (!response2.ok) {
        const errorText = await response2.text();
        console.log(`   Error: ${errorText}`);
      } else {
        console.log('   ✅ Success!');
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }

    // Test 3: Different authorization format
    console.log('\n3. Testing with Bearer token...');
    try {
      const response3 = await fetch(
        `https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/aH_IwxEAAB8AC1dO`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${writeToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`   Status: ${response3.status} ${response3.statusText}`);
      if (!response3.ok) {
        const errorText = await response3.text();
        console.log(`   Error: ${errorText}`);
      } else {
        console.log('   ✅ Success!');
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }

    // Test 4: Check if we need to use a different base URL
    console.log('\n4. Testing with management API base URL...');
    try {
      const response4 = await fetch(
        `https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/aH_IwxEAAB8AC1dO`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Token ${writeToken}`,
            'Content-Type': 'application/json',
            'repository': REPOSITORY_NAME
          }
        }
      );
      console.log(`   Status: ${response4.status} ${response4.statusText}`);
      if (!response4.ok) {
        const errorText = await response4.text();
        console.log(`   Error: ${errorText}`);
      } else {
        console.log('   ✅ Success!');
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPrismicManagementAPI().catch(console.error);
