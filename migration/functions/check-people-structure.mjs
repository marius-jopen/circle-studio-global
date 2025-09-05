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

async function checkPeopleStructure() {
  console.log('🔍 Checking People Document Structure');
  console.log('====================================\n');
  
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ PRISMIC_ACCESS_TOKEN is required');
    return;
  }

  try {
    // Get all people from Prismic
    const peopleResponse = await fetch(
      `https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/search?ref=aLrZAREAAB8Afc5I&q=[[at(document.type,"people")]]&pageSize=5`,
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

    // Show the structure of the first few people
    people.slice(0, 3).forEach((person, index) => {
      console.log(`Person ${index + 1}:`);
      console.log(`  ID: ${person.id}`);
      console.log(`  UID: ${person.uid}`);
      console.log(`  Type: ${person.type}`);
      console.log(`  Data structure:`);
      console.log(JSON.stringify(person.data, null, 4));
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPeopleStructure().catch(console.error);
