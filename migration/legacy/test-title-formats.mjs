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

async function testTitleFormats() {
  console.log('🔍 Testing different title field formats...');
  
  const writeClient = createWriteClient(REPOSITORY_NAME, {
    writeToken: process.env.PRISMIC_WRITE_TOKEN,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  const testCases = [
    {
      name: 'Simple string',
      data: { title: 'Test Person' }
    },
    {
      name: 'Empty string',
      data: { title: '' }
    },
    {
      name: 'Null value',
      data: { title: null }
    },
    {
      name: 'Undefined value',
      data: { title: undefined }
    },
    {
      name: 'Number as string',
      data: { title: '123' }
    },
    {
      name: 'RichText format',
      data: { title: [{ type: 'heading1', text: 'Test Person' }] }
    },
    {
      name: 'RichText paragraph',
      data: { title: [{ type: 'paragraph', text: 'Test Person' }] }
    },
    {
      name: 'No title field',
      data: {}
    },
    {
      name: 'Title with special chars',
      data: { title: '@Test_Person-123' }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🧪 Test ${i + 1}: ${testCase.name}`);
    
    try {
      const result = await writeClient.createDocument({
        type: 'people',
        uid: `test-title-${i + 1}`,
        lang: 'en-us',
        data: {
          ...testCase.data,
          link: { link_type: 'Any' }
        }
      });
      console.log(`✅ Test ${i + 1} passed: ${testCase.name} works!`);
      console.log(`   Document ID: ${result.id}`);
      break; // Stop on first success
    } catch (error) {
      console.log(`❌ Test ${i + 1} failed: ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${JSON.stringify(error.response, null, 2)}`);
      }
    }
  }
}

testTitleFormats().catch(console.error);
