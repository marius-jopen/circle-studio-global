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

async function checkSchema() {
  console.log('🔍 Checking Prismic content type schema...');
  
  // Initialize Prismic client for reading
  const client = createClient(REPOSITORY_NAME, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  try {
    console.log('📡 Fetching repository info...');
    const repository = await client.getRepository();
    console.log('✅ Repository connected:', repository.name);
    
    console.log('\n📋 Available content types:');
    for (const [type, info] of Object.entries(repository.types)) {
      console.log(`  - ${type}: ${info.label}`);
    }
    
    console.log('\n🔍 Checking people content type...');
    if (repository.types.people) {
      console.log('✅ People content type exists');
      console.log('   Label:', repository.types.people.label);
      console.log('   Fields:', Object.keys(repository.types.people.json.Main || {}));
      
      // Check the title field specifically
      const mainFields = repository.types.people.json.Main || {};
      if (mainFields.title) {
        console.log('\n📝 Title field details:');
        console.log('   Type:', mainFields.title.type);
        console.log('   Config:', JSON.stringify(mainFields.title.config, null, 2));
      } else {
        console.log('❌ No title field found in Main section');
      }
      
      // Check if there's a title field in other sections
      for (const [sectionName, section] of Object.entries(repository.types.people.json)) {
        if (section.title) {
          console.log(`\n📝 Title field found in ${sectionName}:`);
          console.log('   Type:', section.title.type);
          console.log('   Config:', JSON.stringify(section.title.config, null, 2));
        }
      }
    } else {
      console.log('❌ People content type not found');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

checkSchema().catch(console.error);
