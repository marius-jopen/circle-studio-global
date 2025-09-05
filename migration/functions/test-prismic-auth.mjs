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

async function testPrismicAuth() {
  console.log('🔐 Testing Prismic Authentication');
  console.log('==================================\n');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  console.log('Environment variables:');
  console.log(`PRISMIC_WRITE_TOKEN: ${writeToken ? 'Set' : 'Not set'}`);
  console.log(`PRISMIC_ACCESS_TOKEN: ${accessToken ? 'Set' : 'Not set'}`);
  console.log(`REPOSITORY_NAME: ${REPOSITORY_NAME}\n`);

  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN is required');
    return;
  }

  try {
    // Test with different authentication formats
    console.log('🔍 Testing different authentication formats...\n');

    // Test 1: Basic auth with token
    console.log('1. Testing Basic auth with token...');
    try {
      const response1 = await fetch(
        `https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/aH_IwxEAAB8AC1dO`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${writeToken}:`).toString('base64')}`,
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

    // Test 2: API key in query parameter
    console.log('\n2. Testing API key in query parameter...');
    try {
      const response2 = await fetch(
        `https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/aH_IwxEAAB8AC1dO?access_token=${writeToken}`,
        {
          method: 'GET',
          headers: {
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

    // Test 3: Different base URL for management API
    console.log('\n3. Testing with management API base URL...');
    try {
      const response3 = await fetch(
        `https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/aH_IwxEAAB8AC1dO`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Token ${writeToken}`,
            'Content-Type': 'application/json',
            'X-API-Key': writeToken
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

    // Test 4: Check if we need to use the access token instead
    console.log('\n4. Testing with access token...');
    if (accessToken) {
      try {
        const response4 = await fetch(
          `https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/aH_IwxEAAB8AC1dO`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Token ${accessToken}`,
              'Content-Type': 'application/json'
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
    } else {
      console.log('   Access token not available');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPrismicAuth().catch(console.error);
