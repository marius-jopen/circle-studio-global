#!/usr/bin/env node

import { createClient } from '@prismicio/client';
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

async function checkExistingDocuments() {
  console.log('🔍 Checking existing documents...');
  
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ PRISMIC_ACCESS_TOKEN is required');
    return;
  }

  try {
    // Create read client
    const client = createClient(REPOSITORY_NAME, {
      accessToken: accessToken,
    });

    console.log('📡 Fetching people documents...');
    
    // Try to get people documents specifically
    try {
      const peopleQuery = await client.getAllByType('people');
      console.log(`👥 People documents found: ${peopleQuery.length}`);
      
      if (peopleQuery.length > 0) {
        console.log('\n📋 First 5 people documents:');
        peopleQuery.slice(0, 5).forEach((doc, i) => {
          console.log(`  ${i + 1}. ${doc.data.title || 'No title'} (${doc.uid})`);
          console.log(`     ID: ${doc.id}`);
          console.log(`     Link: ${doc.data.link?.url || 'No link'}`);
          console.log(`     Published: ${doc.first_publication_date ? 'Yes' : 'No'}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('❌ Error fetching people documents:', error.message);
    }
    
    // Check releases
    console.log('\n📡 Checking releases...');
    try {
      const releases = await client.getReleases();
      console.log(`📦 Releases found: ${releases.length}`);
      
      releases.forEach((release, i) => {
        console.log(`  ${i + 1}. ${release.id} - ${release.title || 'Untitled'}`);
        console.log(`     Ref: ${release.ref}`);
        console.log(`     Documents: ${release.documents?.length || 0}`);
        console.log('');
      });
    } catch (error) {
      console.log('❌ Error fetching releases:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkExistingDocuments().catch(console.error);
