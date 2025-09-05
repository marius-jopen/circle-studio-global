#!/usr/bin/env node

import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '../.env') });
config({ path: join(__dirname, '.env') });

const REPOSITORY_NAME = 'circle-studio-global';

async function generateFinalCreditsWithFoundPeople() {
  console.log('🎯 Final Credits Generation with Found People');
  console.log('=============================================\n');
  
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ PRISMIC_ACCESS_TOKEN is required');
    return;
  }

  try {
    // Read project credits data
    console.log('📋 Reading "The Final" project credits...');
    const projectCreditsPath = join(__dirname, '../output/project-credits-file.json');
    const projectCredits = JSON.parse(readFileSync(projectCreditsPath, 'utf8'));
    
    const finalProject = projectCredits.projects.find(p => p.title === "The Final");
    if (!finalProject) {
      throw new Error('"The Final" project not found in project-credits-file.json');
    }
    
    console.log(`✅ Found "The Final" with ${finalProject.credits.length} credit entries`);

    // Get all people from Prismic
    console.log('\n👥 Fetching all people from Prismic...');
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
    console.log(`✅ Found ${people.length} people in Prismic`);

    // Create people lookup by TITLE field
    const peopleMap = new Map();
    people.forEach(person => {
      const title = person.data.title || '';
      if (title) {
        peopleMap.set(title.toLowerCase().trim(), {
          id: person.id,
          uid: person.uid,
          title: title
        });
      }
    });

    console.log(`✅ Created lookup map with ${peopleMap.size} people who have titles`);

    // Manual mapping based on what we found
    const manualMappings = {
      'Santiago Carrasquilla': 'Santiago Carrasquila', // Found: missing one 'l'
      'Jorge Velandia': 'Jorge Valandia', // Found: different spelling
      'Fabian Palacios V.': 'Fabian Palacios V', // Found: missing period
      'Oro Studio': 'Oro Studio' // Found: exact match
    };

    console.log('\n🔍 Searching for people with manual mappings...');
    
    const foundPeople = {};
    const missingPeople = [];

    // Check each person from "The Final" project
    const targetPeople = [
      'Santiago Carrasquilla',
      'Nick Apple', 
      'Camilo Ojeda',
      'Agua Studio',
      'Jorge Velandia',
      'Fabian Palacios V.',
      'Oro Studio'
    ];

    for (const targetName of targetPeople) {
      console.log(`Looking for: "${targetName}"`);
      
      let found = null;
      
      // Check manual mapping first
      if (manualMappings[targetName]) {
        const mappedName = manualMappings[targetName];
        found = peopleMap.get(mappedName.toLowerCase().trim());
        if (found) {
          console.log(`  ✅ Found by manual mapping: "${found.title}" (${found.id})`);
        }
      }
      
      // If not found by manual mapping, try direct search
      if (!found) {
        found = peopleMap.get(targetName.toLowerCase().trim());
        if (found) {
          console.log(`  ✅ Found by exact match: "${found.title}" (${found.id})`);
        }
      }
      
      // If still not found, try partial search
      if (!found) {
        for (const [title, person] of peopleMap.entries()) {
          if (title.includes(targetName.toLowerCase()) || targetName.toLowerCase().includes(title)) {
            found = person;
            break;
          }
        }
        if (found) {
          console.log(`  ✅ Found by partial match: "${found.title}" (${found.id})`);
        }
      }
      
      if (found) {
        foundPeople[targetName] = [found];
      } else {
        console.log(`  ❌ Not found`);
        missingPeople.push(targetName);
      }
    }

    console.log(`\n📊 Search Results:`);
    console.log(`   - Found: ${Object.keys(foundPeople).length} people`);
    console.log(`   - Missing: ${missingPeople.length} people\n`);

    // Process credits
    console.log('🔄 Processing credits...');
    const creditsToUpdate = [];
    
    for (const credit of finalProject.credits) {
      const position = credit.position;
      const names = Array.isArray(credit.name) ? credit.name : [credit.name];
      
      const creditEntry = {
        label: position,
        person: []
      };

      let foundPeopleInCredit = 0;
      
      for (const name of names) {
        if (foundPeople[name]) {
          const person = foundPeople[name][0];
          creditEntry.person.push({
            link_type: "Document",
            id: person.id
          });
          foundPeopleInCredit++;
          console.log(`   ✅ ${position}: ${name} → ${person.title} (${person.id})`);
        } else {
          console.log(`   ❌ ${position}: ${name} → Not found`);
        }
      }

      if (foundPeopleInCredit > 0) {
        creditsToUpdate.push(creditEntry);
      }
    }

    console.log(`\n📊 Final Credits Summary:`);
    console.log(`   - Total credits: ${finalProject.credits.length}`);
    console.log(`   - Credits with found people: ${creditsToUpdate.length}`);
    console.log(`   - People found: ${Object.keys(foundPeople).length}`);
    console.log(`   - People missing: ${missingPeople.length}`);

    // Generate the complete credits structure
    console.log('\n📋 CREDITS STRUCTURE FOR PRISMIC:');
    console.log('==================================');
    console.log('Copy this JSON into your Prismic credits field:\n');
    console.log('```json');
    console.log(JSON.stringify(creditsToUpdate, null, 2));
    console.log('```\n');

    // Show found people details
    if (Object.keys(foundPeople).length > 0) {
      console.log('✅ FOUND PEOPLE:');
      Object.entries(foundPeople).forEach(([originalName, matches]) => {
        matches.forEach((match, index) => {
          console.log(`   - ${originalName} → ${match.title}`);
          console.log(`     ID: ${match.id}`);
          console.log(`     UID: ${match.uid}\n`);
        });
      });
    }

    // Show missing people
    if (missingPeople.length > 0) {
      console.log('❌ MISSING PEOPLE:');
      missingPeople.forEach(name => {
        console.log(`   - ${name}`);
      });
      console.log('\n💡 These people need to be added to Prismic first.\n');
    }

    // Save the results
    const exportData = {
      project: "The Final",
      credits: creditsToUpdate,
      foundPeople: foundPeople,
      missingPeople: missingPeople,
      timestamp: new Date().toISOString()
    };

    const exportPath = join(__dirname, '../output/final-project-credits-with-found-people.json');
    writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`💾 Complete data saved to: ${exportPath}`);

    console.log('🎉 CREDITS GENERATION COMPLETED!');
    console.log('===============================');
    console.log('✅ Credits structure ready for Prismic');
    console.log('✅ Found people mapped and linked');
    console.log('✅ Missing people identified');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateFinalCreditsWithFoundPeople().catch(console.error);
