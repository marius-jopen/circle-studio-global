#!/usr/bin/env node

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
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
    
    // Test with first 3 people only
    const testData = peopleData.slice(0, 3);
    console.log(`🧪 Testing with first ${testData.length} people...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < testData.length; i++) {
      const person = testData[i];
      
      try {
        console.log(`\n📝 Creating document ${i + 1}/${testData.length}: ${person.title}`);
        
        const response = await fetch('https://migration.prismic.io/documents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${writeToken}`,
            'repository': REPOSITORY_NAME,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(person)
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
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

importPeopleFromJSON().catch(console.error);
