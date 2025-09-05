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

async function checkCreatedDocument() {
  console.log('🔍 Checking if the created document exists...');
  
  const client = createClient(REPOSITORY_NAME, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  try {
    // Try to get all people documents
    console.log('📡 Fetching all people documents...');
    const people = await client.getAllByType('people');
    
    console.log(`📊 Found ${people.length} people documents:`);
    people.forEach((person, index) => {
      console.log(`${index + 1}. ${person.data.title || 'No title'} (${person.uid})`);
      console.log(`   ID: ${person.id}`);
      console.log(`   Last Published: ${person.last_publication_date}`);
      console.log(`   Status: ${person.data ? 'Has data' : 'No data'}`);
      if (person.data && person.data.link) {
        console.log(`   Link: ${JSON.stringify(person.data.link)}`);
      }
      console.log('');
    });

    // Try to get the specific document by ID
    console.log('🔍 Trying to fetch specific document by ID...');
    try {
      const specificDoc = await client.getByID('aLq7ZREAACEAfZsX');
      console.log('✅ Found specific document:', specificDoc.data.title);
    } catch (error) {
      console.log('❌ Could not fetch specific document:', error.message);
    }

  } catch (error) {
    console.error('❌ Error checking documents:', error.message);
  }
}

checkCreatedDocument().catch(console.error);
