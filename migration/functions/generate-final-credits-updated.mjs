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

async function generateFinalCreditsUpdated() {
  console.log('🎯 Updated Credits Generation for "The Final" Project');
  console.log('====================================================\n');
  
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

    // Create people lookup by UID
    const peopleMap = new Map();
    people.forEach(person => {
      const uid = person.uid || '';
      if (uid) {
        peopleMap.set(uid, {
          id: person.id,
          uid: person.uid,
          title: person.data.title?.[0]?.text || 'No title'
        });
      }
    });

    // Define the people we found and their mappings
    const foundPeople = {
      'Santiago Carrasquilla': [
        { id: 'aLrTAhEAACIAfcRm', uid: 'santiago-carrasquila-1757074143872-20' },
        { id: 'aLrS_BEAAB8AfcRR', uid: 'santiago-carraquilla-1757072128169-16' }
      ],
      'Nick Apple': [
        { id: 'FIND_NICK_APPLE_ID', uid: 'nick-apple-uid' } // We need to find this
      ],
      'Jorge Velandia': [
        { id: 'aLrTEhEAACEAfcSZ', uid: 'jorge-valandia-1757074143872-30' }
      ],
      'Fabian Palacios V.': [
        { id: 'aLrTIhEAACEAfcTQ', uid: 'fabian-palacios-v-1757074143872-40' }
      ],
      'Oro Studio': [
        { id: 'aLrTDhEAACIAfcSK', uid: 'oro-studio-1757074143872-27' }
      ]
    };

    // Search for Nick Apple in the people list
    console.log('\n🔍 Searching for Nick Apple...');
    let nickAppleFound = null;
    
    for (const person of people) {
      const uid = person.uid || '';
      if (uid.includes('nick-apple') || uid.includes('nick-apple')) {
        nickAppleFound = {
          id: person.id,
          uid: person.uid,
          title: person.data.title?.[0]?.text || 'No title'
        };
        break;
      }
    }

    if (nickAppleFound) {
      console.log(`✅ Found Nick Apple: ${nickAppleFound.uid} (${nickAppleFound.id})`);
      foundPeople['Nick Apple'] = [nickAppleFound];
    } else {
      console.log('❌ Nick Apple not found in UIDs');
      delete foundPeople['Nick Apple'];
    }

    const missingPeople = ['Camilo Ojeda', 'Agua Studio'];

    console.log('\n🔄 Processing credits...');
    
    // Process each credit entry
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
          // Use the first match for each person
          const person = foundPeople[name][0];
          creditEntry.person.push({
            link_type: "Document",
            id: person.id
          });
          foundPeopleInCredit++;
          console.log(`   ✅ ${position}: ${name} → ${person.uid} (${person.id})`);
        } else {
          console.log(`   ❌ ${position}: ${name} → Not found`);
        }
      }

      if (foundPeopleInCredit > 0) {
        creditsToUpdate.push(creditEntry);
      }
    }

    console.log(`\n📊 Updated Credits Summary:`);
    console.log(`   - Total credits: ${finalProject.credits.length}`);
    console.log(`   - Credits with found people: ${creditsToUpdate.length}`);
    console.log(`   - People found: ${Object.keys(foundPeople).length}`);
    console.log(`   - People missing: ${missingPeople.length}`);

    // Generate the complete credits structure
    console.log('\n📋 UPDATED CREDITS STRUCTURE FOR PRISMIC:');
    console.log('==========================================');
    console.log('Copy this JSON into your Prismic credits field:\n');
    console.log('```json');
    console.log(JSON.stringify(creditsToUpdate, null, 2));
    console.log('```\n');

    // Show found people details
    console.log('✅ FOUND PEOPLE:');
    Object.entries(foundPeople).forEach(([originalName, matches]) => {
      matches.forEach((match, index) => {
        console.log(`   - ${originalName}${matches.length > 1 ? ` (${index + 1})` : ''} → ${match.uid}`);
        console.log(`     ID: ${match.id}\n`);
      });
    });

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

    const exportPath = join(__dirname, '../output/final-project-credits-updated.json');
    writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`💾 Complete data saved to: ${exportPath}`);

    console.log('🎉 UPDATED CREDITS GENERATION COMPLETED!');
    console.log('=======================================');
    console.log('✅ Credits structure ready for Prismic');
    console.log('✅ Found people mapped and linked');
    console.log('✅ Missing people identified');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateFinalCreditsUpdated().catch(console.error);
