#!/usr/bin/env node

import { createClient } from '@prismicio/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });
config({ path: join(__dirname, '.env') });

const REPOSITORY_NAME = 'circle-studio-global';

async function testManagementAPI() {
  console.log('🔍 Testing Management API approach...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  if (!writeToken || !accessToken) {
    console.error('❌ Both tokens required');
    return;
  }

  try {
    // Try using the Prismic client with both tokens
    const writeClient = createClient(REPOSITORY_NAME, {
      writeToken: writeToken,
      accessToken: accessToken,
    });

    console.log('📡 Testing document creation with Prismic client...');
    
    // Test creating a document
    const result = await writeClient.createDocument({
      type: 'people',
      uid: 'management-test-' + Date.now(),
      lang: 'en-us',
      title: 'Management API Test',
      data: {
        link: { link_type: 'Any' }
      }
    });

    console.log('✅ Document created with Management API!');
    console.log('   ID:', result.id);
    console.log('   Title:', result.title);
    console.log('   UID:', result.uid);

    // Wait and try to fetch it
    console.log('⏳ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try to fetch it via Content API
    const readClient = createClient(REPOSITORY_NAME, {
      accessToken: accessToken,
    });

    try {
      const fetchedDoc = await readClient.getByID(result.id);
      console.log('🎉 SUCCESS! Document is visible via Content API!');
      console.log('   Fetched title:', fetchedDoc.data.title);
    } catch (fetchError) {
      console.log('❌ Document not visible via Content API:', fetchError.message);
    }

  } catch (error) {
    console.error('❌ Management API error:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

testManagementAPI().catch(console.error);
