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

async function showAllPeopleTitles() {
  console.log('👥 All People Titles in Prismic');
  console.log('================================\n');
  
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

    // Show all people titles
    people.forEach((person, index) => {
      const title = person.data.title || 'No title';
      const uid = person.uid || 'No UID';
      const id = person.id || 'No ID';
      
      console.log(`${(index + 1).toString().padStart(3)}. "${title}"`);
      console.log(`     UID: ${uid}`);
      console.log(`     ID: ${id}`);
      console.log('');
    });

    // Look for people we need for "The Final" project
    console.log('\n🎯 SEARCHING FOR "THE FINAL" PROJECT PEOPLE:');
    console.log('============================================\n');
    
    const targetPeople = [
      'Santiago Carrasquilla',
      'Nick Apple', 
      'Camilo Ojeda',
      'Agua Studio',
      'Jorge Velandia',
      'Fabian Palacios V.',
      'Oro Studio'
    ];

    const foundMatches = [];
    const missingMatches = [];

    targetPeople.forEach(targetName => {
      console.log(`Looking for: "${targetName}"`);
      
      // Search by title
      const titleMatch = people.find(person => {
        const title = person.data.title || '';
        return title.toLowerCase().includes(targetName.toLowerCase()) ||
               targetName.toLowerCase().includes(title.toLowerCase());
      });
      
      if (titleMatch) {
        console.log(`  ✅ Found: "${titleMatch.data.title}" (${titleMatch.id})`);
        foundMatches.push({
          originalName: targetName,
          foundName: titleMatch.data.title,
          id: titleMatch.id,
          uid: titleMatch.uid
        });
      } else {
        console.log(`  ❌ Not found`);
        missingMatches.push(targetName);
      }
    });

    console.log('\n📊 "THE FINAL" PROJECT MATCHES:');
    console.log('===============================');
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

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showAllPeopleTitles().catch(console.error);
