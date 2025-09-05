#!/usr/bin/env node

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '../.env') });
config({ path: join(__dirname, '.env') });

const REPOSITORY_NAME = 'circle-studio-global';

async function importPeopleFromJSON() {
  console.log('🚀 Starting people import from JSON...');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  if (!writeToken || !accessToken) {
    console.error('❌ Both PRISMIC_WRITE_TOKEN and PRISMIC_ACCESS_TOKEN are required');
    return;
  }

  try {
    // Load the JSON data
    const jsonPath = join(__dirname, 'output/people-prismic-format.json');
    const jsonContent = readFileSync(jsonPath, 'utf8');
    const peopleData = JSON.parse(jsonContent);
    
    console.log(`📊 Loaded ${peopleData.length} people from JSON`);
    
    // Ask user how many to import
    const args = process.argv.slice(2);
    let importCount = peopleData.length; // Default: import all
    
    if (args.length > 0) {
      const requestedCount = parseInt(args[0]);
      if (!isNaN(requestedCount) && requestedCount > 0) {
        importCount = Math.min(requestedCount, peopleData.length);
      }
    }
    
    const testData = peopleData.slice(0, importCount);
    console.log(`🧪 Importing ${testData.length} people...`);
    
    let successCount = 0;
    let errorCount = 0;
    const timestamp = Date.now();
    
    for (let i = 0; i < testData.length; i++) {
      const person = testData[i];
      
      // Add timestamp to UID to make it unique
      const uniquePerson = {
        ...person,
        uid: `${person.uid}-${timestamp}-${i}`
      };
      
      try {
        console.log(`\n📝 Creating document ${i + 1}/${testData.length}: ${person.title}`);
        console.log(`   UID: ${uniquePerson.uid}`);
        
        const response = await fetch('https://migration.prismic.io/documents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${writeToken}`,
            'repository': REPOSITORY_NAME,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(uniquePerson)
        });
        
        console.log(`📥 Response status: ${response.status}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Created: ${person.title} (${result.id})`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.log(`❌ Failed: ${person.title}`);
          console.log(`   Error: ${errorText}`);
          errorCount++;
        }
        
        // Rate limiting - wait 1 second between requests
        if (i < testData.length - 1) {
          console.log('⏳ Waiting 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Error creating ${person.title}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total: ${testData.length}`);
    
    if (successCount > 0) {
      console.log(`\n🎉 Documents created successfully!`);
      console.log(`   Check your Prismic dashboard for a "Migration Release"`);
      console.log(`   You may need to publish the release to see the documents`);
      console.log(`   The documents are in draft state and need to be published manually`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node people-import-from-json-final.mjs [count]');
  console.log('');
  console.log('Arguments:');
  console.log('  count    Number of people to import (default: all 252)');
  console.log('');
  console.log('Examples:');
  console.log('  node people-import-from-json-final.mjs        # Import all 252 people');
  console.log('  node people-import-from-json-final.mjs 10     # Import first 10 people');
  console.log('  node people-import-from-json-final.mjs 1      # Import just 1 person');
  process.exit(0);
}

importPeopleFromJSON().catch(console.error);
