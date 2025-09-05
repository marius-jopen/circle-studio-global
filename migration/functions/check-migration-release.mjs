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

async function checkMigrationRelease() {
  console.log('🔍 Checking for Migration Release...');
  
  const client = createClient(REPOSITORY_NAME, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  try {
    // Try to get repository info to see releases
    console.log('📡 Fetching repository info...');
    const repository = await client.getRepository();
    
    console.log('📊 Repository info:');
    console.log('   Name:', repository.name);
    console.log('   Refs:', Object.keys(repository.refs || {}));
    
    // Check if there are any releases
    if (repository.refs) {
      console.log('\n📋 Available refs:');
      for (const [refName, refInfo] of Object.entries(repository.refs)) {
        console.log(`   ${refName}:`, refInfo.label || 'No label');
        if (refInfo.isMasterRef) {
          console.log('     (Master ref)');
        }
      }
    }

    // Try to get documents with different refs
    console.log('\n🔍 Checking documents with master ref...');
    try {
      const masterDocs = await client.getAllByType('people', {
        ref: repository.masterRef
      });
      console.log(`📊 Found ${masterDocs.length} people documents in master ref`);
      masterDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.data.title || 'No title'} (${doc.uid})`);
      });
    } catch (error) {
      console.log('❌ Error fetching master ref documents:', error.message);
    }

    // Try to get documents with preview ref (might include drafts)
    console.log('\n🔍 Checking documents with preview ref...');
    try {
      const previewClient = createClient(REPOSITORY_NAME, {
        accessToken: process.env.PRISMIC_ACCESS_TOKEN,
        previewRef: repository.masterRef
      });
      
      const previewDocs = await previewClient.getAllByType('people');
      console.log(`📊 Found ${previewDocs.length} people documents in preview mode`);
      previewDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.data.title || 'No title'} (${doc.uid})`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      First Published: ${doc.first_publication_date || 'Not published'}`);
        console.log(`      Last Published: ${doc.last_publication_date || 'Not published'}`);
      });
    } catch (error) {
      console.log('❌ Error fetching preview documents:', error.message);
    }

  } catch (error) {
    console.error('❌ Error checking migration release:', error.message);
  }
}

checkMigrationRelease().catch(console.error);
