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

async function testRandomPerson() {
  console.log('🎲 Testing with a random person from the bottom of the list...');
  
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
    
    // Pick someone from the bottom of the list (last 10 people)
    const bottomPeople = peopleData.slice(-10);
    const randomIndex = Math.floor(Math.random() * bottomPeople.length);
    const selectedPerson = bottomPeople[randomIndex];
    
    console.log(`🎯 Selected person from bottom 10: ${selectedPerson.title}`);
    console.log(`   Original UID: ${selectedPerson.uid}`);
    console.log(`   Instagram: ${selectedPerson.data.link?.url || 'N/A'}`);
    
    // Add unique timestamp to UID
    const timestamp = Date.now();
    const uniquePerson = {
      ...selectedPerson,
      uid: `${selectedPerson.uid}-test-${timestamp}`
    };
    
    console.log(`   New UID: ${uniquePerson.uid}`);
    
    try {
      console.log(`\n📝 Creating document: ${selectedPerson.title}`);
      
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
        console.log(`✅ SUCCESS! Created: ${selectedPerson.title}`);
        console.log(`   Document ID: ${result.id}`);
        console.log(`   UID: ${result.uid}`);
        
        // Wait and try to fetch it
        console.log('\n⏳ Waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
          const fetchResponse = await fetch(`https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/${result.id}`, {
            headers: {
              'Authorization': `Token ${accessToken}`
            }
          });
          
          console.log(`📥 Fetch status: ${fetchResponse.status}`);
          if (fetchResponse.ok) {
            const doc = await fetchResponse.json();
            console.log('🎉 Document is visible via Content API!');
            console.log('   Title:', doc.title);
            console.log('   Data:', JSON.stringify(doc.data, null, 2));
          } else {
            console.log('❌ Document not visible via Content API (this is expected for Migration API)');
            console.log('   The document is in a Migration Release and needs to be published');
          }
        } catch (fetchError) {
          console.log('❌ Error fetching document:', fetchError.message);
        }
        
      } else {
        const errorText = await response.text();
        console.log(`❌ FAILED: ${selectedPerson.title}`);
        console.log(`   Error: ${errorText}`);
      }
      
    } catch (error) {
      console.error(`❌ Error creating ${selectedPerson.title}:`, error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRandomPerson().catch(console.error);
