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

async function searchAllPeople() {
  console.log('🔍 Comprehensive People Search');
  console.log('==============================\n');
  
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

    // Search for specific terms
    const searchTerms = ['nick', 'apple', 'santiago', 'carrasquilla', 'camilo', 'ojeda', 'agua', 'studio', 'jorge', 'velandia'];
    
    console.log('🔍 SEARCHING FOR SPECIFIC TERMS:');
    console.log('=================================\n');
    
    searchTerms.forEach(term => {
      console.log(`Searching for "${term}":`);
      const matches = people.filter(person => {
        const title = person.data.title || '';
        const uid = person.uid || '';
        return title.toLowerCase().includes(term.toLowerCase()) || 
               uid.toLowerCase().includes(term.toLowerCase());
      });
      
      if (matches.length > 0) {
        console.log(`  Found ${matches.length} matches:`);
        matches.forEach(person => {
          console.log(`    - "${person.data.title}" (UID: ${person.uid})`);
        });
      } else {
        console.log(`  No matches found`);
      }
      console.log('');
    });

    // Show all people with "Nick" in their name
    console.log('👤 ALL PEOPLE WITH "NICK":');
    console.log('===========================');
    const nickPeople = people.filter(person => {
      const title = person.data.title || '';
      return title.toLowerCase().includes('nick');
    });
    
    nickPeople.forEach(person => {
      console.log(`- "${person.data.title}" (ID: ${person.id}, UID: ${person.uid})`);
    });

    // Show all people with "Apple" in their name
    console.log('\n🍎 ALL PEOPLE WITH "APPLE":');
    console.log('===========================');
    const applePeople = people.filter(person => {
      const title = person.data.title || '';
      return title.toLowerCase().includes('apple');
    });
    
    if (applePeople.length > 0) {
      applePeople.forEach(person => {
        console.log(`- "${person.data.title}" (ID: ${person.id}, UID: ${person.uid})`);
      });
    } else {
      console.log('No people found with "Apple" in their name');
    }

    // Show all people with "Santiago" in their name
    console.log('\n👤 ALL PEOPLE WITH "SANTIAGO":');
    console.log('===============================');
    const santiagoPeople = people.filter(person => {
      const title = person.data.title || '';
      return title.toLowerCase().includes('santiago');
    });
    
    santiagoPeople.forEach(person => {
      console.log(`- "${person.data.title}" (ID: ${person.id}, UID: ${person.uid})`);
    });

    // Show all people with "Camilo" in their name
    console.log('\n👤 ALL PEOPLE WITH "CAMILO":');
    console.log('============================');
    const camiloPeople = people.filter(person => {
      const title = person.data.title || '';
      return title.toLowerCase().includes('camilo');
    });
    
    camiloPeople.forEach(person => {
      console.log(`- "${person.data.title}" (ID: ${person.id}, UID: ${person.uid})`);
    });

    // Show all people with "Agua" in their name
    console.log('\n💧 ALL PEOPLE WITH "AGUA":');
    console.log('==========================');
    const aguaPeople = people.filter(person => {
      const title = person.data.title || '';
      return title.toLowerCase().includes('agua');
    });
    
    if (aguaPeople.length > 0) {
      aguaPeople.forEach(person => {
        console.log(`- "${person.data.title}" (ID: ${person.id}, UID: ${person.uid})`);
      });
    } else {
      console.log('No people found with "Agua" in their name');
    }

    // Show all people with "Jorge" in their name
    console.log('\n👤 ALL PEOPLE WITH "JORGE":');
    console.log('===========================');
    const jorgePeople = people.filter(person => {
      const title = person.data.title || '';
      return title.toLowerCase().includes('jorge');
    });
    
    jorgePeople.forEach(person => {
      console.log(`- "${person.data.title}" (ID: ${person.id}, UID: ${person.uid})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

searchAllPeople().catch(console.error);
