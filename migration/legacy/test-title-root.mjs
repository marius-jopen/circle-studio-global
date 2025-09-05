#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });
config({ path: join(__dirname, '.env') });

async function testTitleRoot() {
  console.log('🔍 Testing title field at root level...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  const repository = 'circle-studio-global';
  
  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN not found');
    return;
  }

  // Test 1: Title at root level
  const testData1 = {
    type: 'people',
    uid: 'test-title-root-1',
    lang: 'en-us',
    title: 'Test Person Root Title',
    data: {
      link: { link_type: 'Any' }
    }
  };

  console.log('📤 Test 1 - Title at root level:');
  console.log(JSON.stringify(testData1, null, 2));

  try {
    const response1 = await fetch('https://migration.prismic.io/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${writeToken}`,
        'repository': repository,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData1)
    });

    console.log('📥 Response status:', response1.status);
    const responseText1 = await response1.text();
    console.log('📥 Response body:', responseText1);

    if (response1.ok) {
      console.log('✅ Test 1 succeeded!');
      return;
    }
  } catch (error) {
    console.error('❌ Test 1 error:', error.message);
  }

  // Test 2: Different structure
  const testData2 = {
    type: 'people',
    uid: 'test-title-root-2',
    lang: 'en-us',
    data: {
      title: 'Test Person Data Title',
      link: { link_type: 'Any' }
    }
  };

  console.log('\n📤 Test 2 - Title in data object:');
  console.log(JSON.stringify(testData2, null, 2));

  try {
    const response2 = await fetch('https://migration.prismic.io/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${writeToken}`,
        'repository': repository,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData2)
    });

    console.log('📥 Response status:', response2.status);
    const responseText2 = await response2.text();
    console.log('📥 Response body:', responseText2);

    if (response2.ok) {
      console.log('✅ Test 2 succeeded!');
    } else {
      console.log('❌ Test 2 failed');
    }
  } catch (error) {
    console.error('❌ Test 2 error:', error.message);
  }
}

testTitleRoot().catch(console.error);
