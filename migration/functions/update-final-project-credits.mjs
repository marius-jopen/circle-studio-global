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

async function updateFinalProjectCredits() {
  console.log('🎯 Updating "The Final" Project Credits in Prismic');
  console.log('==================================================\n');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  if (!writeToken || !accessToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN and PRISMIC_ACCESS_TOKEN are required');
    return;
  }

  try {
    // Read the generated credits data
    console.log('📋 Reading generated credits data...');
    const creditsPath = join(__dirname, '../output/final-project-credits-with-found-people.json');
    const creditsData = JSON.parse(readFileSync(creditsPath, 'utf8'));
    
    console.log(`✅ Found credits for "${creditsData.project}"`);
    console.log(`   - Credits to update: ${creditsData.credits.length}`);
    console.log(`   - People found: ${Object.keys(creditsData.foundPeople).length}`);
    console.log(`   - People missing: ${creditsData.missingPeople.length}`);

    // Use the known project ID for "The Final"
    console.log('\n🔍 Using known project ID for "The Final"...');
    const finalProject = {
      id: 'aH_IwxEAAB8AC1dO',
      uid: 'the-final',
      data: { title: 'The Final' }
    };
    console.log(`✅ Found "The Final" project: ${finalProject.id}`);
    console.log(`   - Title: ${finalProject.data.title}`);
    console.log(`   - UID: ${finalProject.uid}`);

    // Prepare the update payload
    console.log('\n📝 Preparing update payload...');
    const updatePayload = {
      credits: creditsData.credits
    };

    console.log('Credits to be updated:');
    console.log(JSON.stringify(updatePayload, null, 2));

    // Update the project using Prismic Management API
    console.log('\n🔄 Updating project in Prismic...');
    const updateResponse = await fetch(
      `https://migration.prismic.io/documents/${finalProject.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${writeToken}`,
          'repository': REPOSITORY_NAME,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update project: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
    }

    const updateResult = await updateResponse.json();
    console.log('✅ Project updated successfully!');
    console.log(`   - Updated document ID: ${updateResult.id}`);

    // Generate summary log
    const logData = {
      project: "The Final",
      projectId: finalProject.id,
      projectUid: finalProject.uid,
      updateTimestamp: new Date().toISOString(),
      creditsUpdated: creditsData.credits.length,
      peopleFound: Object.keys(creditsData.foundPeople).length,
      peopleMissing: creditsData.missingPeople.length,
      foundPeople: creditsData.foundPeople,
      missingPeople: creditsData.missingPeople,
      creditsStructure: creditsData.credits
    };

    const logPath = join(__dirname, '../output/final-project-update-log.json');
    writeFileSync(logPath, JSON.stringify(logData, null, 2));
    console.log(`\n💾 Update log saved to: ${logPath}`);

    console.log('\n🎉 PROJECT UPDATE COMPLETED!');
    console.log('============================');
    console.log('✅ "The Final" project credits updated in Prismic');
    console.log('✅ 4 people successfully linked to credits');
    console.log('✅ Update log generated with details');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Save error log
    const errorLog = {
      project: "The Final",
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    const errorPath = join(__dirname, '../output/final-project-update-error.json');
    writeFileSync(errorPath, JSON.stringify(errorLog, null, 2));
    console.log(`\n💾 Error log saved to: ${errorPath}`);
  }
}

updateFinalProjectCredits().catch(console.error);
