#!/usr/bin/env node

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

async function findMissingPeople() {
  console.log('🔍 Searching for Missing People in Prismic');
  console.log('==========================================\n');
  
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ PRISMIC_ACCESS_TOKEN is required');
    return;
  }

  try {
    // Get all people from Prismic
    const peopleResponse = await fetch(
      `https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/search?ref=aLrZAREAAB8Afc5I&q=[[at(document.type,"people")]]&pageSize=100`,
      {
        headers: {
          'Authorization': `Token ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!peopleResponse.ok) {
      throw new Error(`Failed to fetch people: ${peopleResponse.status} ${peopleResponse.statusText}`);
    }

    const peopleData = await peopleResponse.json();
    const people = peopleData.results || [];
    
    console.log(`Found ${people.length} people in Prismic\n`);

    // The people we're looking for from "The Final" project
    const targetPeople = [
      'Santiago Carrasquilla',
      'Nick Apple', 
      'Camilo Ojeda',
      'Agua Studio',
      'Jorge Velandia',
      'Fabian Palacios V.',
      'Oro Studio'
    ];

    console.log('🎯 SEARCHING FOR EACH PERSON:');
    console.log('==============================\n');
    
    const foundMatches = [];
    const missingMatches = [];

    targetPeople.forEach(targetName => {
      console.log(`Looking for: "${targetName}"`);
      
      // Search by exact title match
      let found = people.find(person => {
        const title = person.data.title || '';
        return title.toLowerCase().trim() === targetName.toLowerCase().trim();
      });
      
      if (found) {
        console.log(`  ✅ Found by exact match: "${found.data.title}" (${found.id})`);
        foundMatches.push({
          originalName: targetName,
          foundName: found.data.title,
          id: found.id,
          uid: found.uid
        });
      } else {
        // Search by partial match
        found = people.find(person => {
          const title = person.data.title || '';
          return title.toLowerCase().includes(targetName.toLowerCase()) ||
                 targetName.toLowerCase().includes(title.toLowerCase());
        });
        
        if (found) {
          console.log(`  ✅ Found by partial match: "${found.data.title}" (${found.id})`);
          foundMatches.push({
            originalName: targetName,
            foundName: found.data.title,
            id: found.id,
            uid: found.uid
          });
        } else {
          console.log(`  ❌ Not found`);
          missingMatches.push(targetName);
        }
      }
    });

    console.log('\n📊 SEARCH RESULTS:');
    console.log('==================');
    console.log(`✅ Found: ${foundMatches.length} people`);
    console.log(`❌ Missing: ${missingMatches.length} people\n`);

    if (foundMatches.length > 0) {
      console.log('✅ FOUND PEOPLE:');
      foundMatches.forEach(person => {
        console.log(`   - ${person.originalName} → "${person.foundName}"`);
        console.log(`     ID: ${person.id}`);
        console.log(`     UID: ${person.uid}\n`);
      });
    }

    if (missingMatches.length > 0) {
      console.log('❌ MISSING PEOPLE:');
      missingMatches.forEach(name => {
        console.log(`   - ${name}`);
      });
    }

    // Let's also search for "Nick" specifically
    console.log('\n🔍 SPECIFIC SEARCH FOR "NICK":');
    console.log('===============================');
    const nickMatches = people.filter(person => {
      const title = person.data.title || '';
      return title.toLowerCase().includes('nick');
    });
    
    if (nickMatches.length > 0) {
      console.log(`Found ${nickMatches.length} people with "Nick" in their title:`);
      nickMatches.forEach(person => {
        console.log(`   - "${person.data.title}" (${person.id})`);
      });
    } else {
      console.log('No people found with "Nick" in their title');
    }

    // Let's also search for "Apple" specifically
    console.log('\n🔍 SPECIFIC SEARCH FOR "APPLE":');
    console.log('================================');
    const appleMatches = people.filter(person => {
      const title = person.data.title || '';
      return title.toLowerCase().includes('apple');
    });
    
    if (appleMatches.length > 0) {
      console.log(`Found ${appleMatches.length} people with "Apple" in their title:`);
      appleMatches.forEach(person => {
        console.log(`   - "${person.data.title}" (${person.id})`);
      });
    } else {
      console.log('No people found with "Apple" in their title');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findMissingPeople().catch(console.error);
