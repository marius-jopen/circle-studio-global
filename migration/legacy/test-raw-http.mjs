#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });
config({ path: join(__dirname, '.env') });

async function testRawHTTP() {
  console.log('🔍 Testing raw HTTP request to Migration API...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  const repository = 'circle-studio-global';
  
  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN not found');
    return;
  }

  const testData = {
    type: 'people',
    uid: 'test-raw-http',
    lang: 'en-us',
    data: {
      title: 'Test Person Raw HTTP'
    }
  };

  console.log('📤 Sending request with data:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('https://migration.prismic.io/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${writeToken}`,
        'repository': repository,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (response.ok) {
      console.log('✅ Raw HTTP request succeeded!');
    } else {
      console.log('❌ Raw HTTP request failed');
    }

  } catch (error) {
    console.error('❌ Raw HTTP request error:', error.message);
  }
}

testRawHTTP().catch(console.error);
