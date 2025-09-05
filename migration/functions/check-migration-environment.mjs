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

async function checkMigrationEnvironment() {
  console.log('🔍 Checking Migration Environment');
  console.log('==================================\n');
  
  const writeToken = process.env.PRISMIC_WRITE_TOKEN;
  
  if (!writeToken) {
    console.error('❌ PRISMIC_WRITE_TOKEN is required');
    return;
  }

  try {
    // Check what's available in the migration environment
    console.log('📋 Checking migration environment...');
    
    // List all documents in migration environment
    const response = await fetch('https://migration.prismic.io/documents', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${writeToken}`,
        'repository': REPOSITORY_NAME,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.length || 0} documents in migration environment`);
      
      if (data.length > 0) {
        console.log('\n📋 Documents in migration environment:');
        data.slice(0, 10).forEach((doc, index) => {
          console.log(`${(index + 1).toString().padStart(3)}. ${doc.title || 'No title'} (${doc.id})`);
        });
        
        if (data.length > 10) {
          console.log(`   ... and ${data.length - 10} more`);
        }
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
    }

    // Check if "The Final" project exists in migration environment
    console.log('\n🔍 Checking for "The Final" project in migration environment...');
    const finalResponse = await fetch('https://migration.prismic.io/documents', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${writeToken}`,
        'repository': REPOSITORY_NAME,
        'Content-Type': 'application/json'
      }
    });
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      const finalProject = finalData.find(doc => 
        doc.title && doc.title.toLowerCase().includes('final')
      );
      
      if (finalProject) {
        console.log(`✅ Found "The Final" project in migration environment: ${finalProject.id}`);
        console.log(`   Title: ${finalProject.title}`);
        console.log(`   UID: ${finalProject.uid}`);
      } else {
        console.log('❌ "The Final" project not found in migration environment');
        console.log('💡 You may need to copy the project to the migration environment first');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMigrationEnvironment().catch(console.error);
