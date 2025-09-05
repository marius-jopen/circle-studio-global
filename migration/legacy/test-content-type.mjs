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

async function testContentType() {
  console.log('🔍 Testing content type configuration...');
  
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ PRISMIC_ACCESS_TOKEN not found');
    return;
  }

  try {
    // Test 1: Check if we can access the repository at all
    console.log('\n🧪 Test 1: Basic repository access');
    const repoResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2`, {
      headers: {
        'Authorization': `Token ${accessToken}`
      }
    });
    
    console.log('📥 Repository API status:', repoResponse.status);
    if (repoResponse.ok) {
      const repoData = await repoResponse.json();
      console.log('✅ Repository accessible');
      console.log('   Name:', repoData.name);
      console.log('   Types:', Object.keys(repoData.types || {}));
    } else {
      console.log('❌ Repository not accessible');
      return;
    }

    // Test 2: Check if people content type exists
    console.log('\n🧪 Test 2: People content type check');
    const typesResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/types`, {
      headers: {
        'Authorization': `Token ${accessToken}`
      }
    });
    
    console.log('📥 Types API status:', typesResponse.status);
    if (typesResponse.ok) {
      const typesData = await typesResponse.json();
      console.log('✅ Types API accessible');
      console.log('   Available types:', Object.keys(typesData.types || {}));
      
      if (typesData.types && typesData.types.people) {
        console.log('✅ People content type exists');
        console.log('   People type:', JSON.stringify(typesData.types.people, null, 2));
      } else {
        console.log('❌ People content type not found');
        console.log('   Available types:', Object.keys(typesData.types || {}));
      }
    } else {
      console.log('❌ Types API not accessible');
    }

    // Test 3: Try to create a document with a different content type
    console.log('\n🧪 Test 3: Try creating with different content type');
    const writeToken = process.env.PRISMIC_WRITE_TOKEN;
    
    if (writeToken) {
      // Try creating a "home" document (singleton)
      const homeData = {
        type: 'home',
        uid: 'test-home-' + Date.now(),
        lang: 'en-us',
        title: 'Test Home',
        data: {}
      };

      const homeResponse = await fetch('https://migration.prismic.io/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${writeToken}`,
          'repository': REPOSITORY_NAME,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(homeData)
      });

      console.log('📥 Home document create status:', homeResponse.status);
      const homeText = await homeResponse.text();
      console.log('📥 Home document response:', homeText);
    }

  } catch (error) {
    console.error('❌ Error in content type test:', error.message);
  }
}

testContentType().catch(console.error);
