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

async function testDraftCheck() {
  console.log('🔍 Checking if documents are in draft state...');
  
  const client = createClient(REPOSITORY_NAME, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  try {
    // Try to get all documents (including drafts)
    console.log('📡 Fetching all documents...');
    const allDocs = await client.getAllByType('people', { 
      fetchLinks: [],
      graphQuery: `{
        people {
          title
          link
        }
      }`
    });
    
    console.log(`📊 Found ${allDocs.length} people documents in Content API:`);
    allDocs.forEach((person, index) => {
      console.log(`${index + 1}. ${person.data.title || 'No title'} (${person.uid})`);
      console.log(`   ID: ${person.id}`);
      console.log(`   Last Published: ${person.last_publication_date}`);
    });

    // Try to get documents with a preview ref (drafts)
    console.log('\n🔍 Trying to fetch with preview ref (drafts)...');
    try {
      const previewClient = createClient(REPOSITORY_NAME, {
        accessToken: process.env.PRISMIC_ACCESS_TOKEN,
        previewRef: 'master' // Try to get drafts
      });
      
      const previewDocs = await previewClient.getAllByType('people');
      console.log(`📊 Found ${previewDocs.length} people documents in preview mode:`);
      previewDocs.forEach((person, index) => {
        console.log(`${index + 1}. ${person.data.title || 'No title'} (${person.uid})`);
        console.log(`   ID: ${person.id}`);
      });
    } catch (previewError) {
      console.log('❌ Could not fetch preview documents:', previewError.message);
    }

  } catch (error) {
    console.error('❌ Error checking documents:', error.message);
  }
}

testDraftCheck().catch(console.error);
