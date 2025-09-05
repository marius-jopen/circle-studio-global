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

async function testOtherTypes() {
  console.log('🔍 Testing other content types...');
  
  const writeClient = createWriteClient(REPOSITORY_NAME, {
    writeToken: process.env.PRISMIC_WRITE_TOKEN,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  // Test different content types
  const contentTypes = ['home', 'page', 'projects', 'settings'];
  
  for (const type of contentTypes) {
    console.log(`\n🧪 Testing ${type} content type...`);
    
    try {
      const result = await writeClient.createDocument({
        type: type,
        uid: `test-${type}-${Date.now()}`,
        lang: 'en-us',
        data: {
          title: 'Test Title'
        }
      });
      console.log(`✅ ${type} content type works!`);
      console.log(`   Document ID: ${result.id}`);
    } catch (error) {
      console.log(`❌ ${type} content type failed: ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${JSON.stringify(error.response, null, 2)}`);
      }
    }
  }
  
  // Also test if we can read existing documents
  console.log('\n🔍 Testing if we can read existing documents...');
  try {
    const client = createWriteClient(REPOSITORY_NAME, {
      accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    });
    
    // Try to get repository info
    const repository = await client.getRepository();
    console.log('✅ Can read repository info');
    console.log('   Repository name:', repository.name);
    console.log('   Available types:', Object.keys(repository.types || {}));
    
  } catch (error) {
    console.log('❌ Cannot read repository info:', error.message);
  }
}

testOtherTypes().catch(console.error);
