#!/usr/bin/env node

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { createWriteClient, createMigration } from '@prismicio/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });
config({ path: join(__dirname, '.env') });

const REPOSITORY_NAME = 'circle-studio-global';

async function main() {
  const args = process.argv.slice(2);
  const csvFile = args.find(arg => arg.startsWith('--file='))?.split('=')[1] || './static/Circle Studio Global Webpage Tracker.csv';
  const dryRun = !args.includes('--dry-run=false');
  
  console.log(`📁 Reading CSV file: ${csvFile}`);
  console.log(`🔍 Dry run: ${dryRun ? 'YES' : 'NO'}`);
  
  // Validate environment
  if (!process.env.PRISMIC_WRITE_TOKEN) {
    console.error('❌ PRISMIC_WRITE_TOKEN is required');
    process.exit(1);
  }
  
  if (!process.env.PRISMIC_ACCESS_TOKEN) {
    console.warn('⚠️  PRISMIC_ACCESS_TOKEN not found - this may cause issues based on Prismic support');
  }

  // Initialize Prismic client with both tokens (as per support conversation)
  const writeClient = createWriteClient(REPOSITORY_NAME, {
    writeToken: process.env.PRISMIC_WRITE_TOKEN,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  try {
    // Read and parse CSV
    const csvContent = readFileSync(csvFile, 'utf-8');
    const records = parse(csvContent, {
      columns: ['Name', 'Instagram Link', 'Column3', 'Column4'], // Explicit column names
      skip_empty_lines: true,
      trim: true,
      from_line: 2 // Skip the first empty row
    });

    console.log(`📊 Found ${records.length} records in CSV`);

    // Filter out empty rows and process data
    const peopleData = records
      .filter(row => row.Name && row.Name.trim() !== '' && row.Name !== 'Name')
      .map(row => {
        let instagramLink = row['Instagram Link']?.trim() || null;
        // Remove trailing # from Instagram links (as per existing migration README)
        if (instagramLink && instagramLink.endsWith('#')) {
          instagramLink = instagramLink.slice(0, -1);
        }
        return {
          name: row.Name.trim(),
          instagramLink: instagramLink
        };
      })
      .filter(person => person.name && person.name !== 'Name'); // Remove header row and empty names

    console.log(`👥 Processing ${peopleData.length} people`);

    if (dryRun) {
      console.log('\n🔍 DRY RUN - Would create the following people:');
      peopleData.forEach((person, index) => {
        console.log(`${index + 1}. ${person.name}${person.instagramLink ? ` (${person.instagramLink})` : ''}`);
      });
      console.log('\nTo apply changes, run with --dry-run=false');
      return;
    }

    // Test with individual document creation first
    let successCount = 0;
    let errorCount = 0;

    for (const person of peopleData.slice(0, 3)) {
      try {
        // Generate UID from name (lowercase, replace spaces with hyphens, remove special chars)
        const uid = person.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
          .substring(0, 50); // Limit length for UID

        // Prepare link data
        const linkData = person.instagramLink ? {
          link_type: 'Web',
          url: person.instagramLink
        } : {
          link_type: 'Any'
        };

        // Create document individually
        console.log(`🔍 Creating document for ${person.name}...`);
        const created = await writeClient.createDocument({
          type: 'people',
          uid: uid,
          lang: 'en-us',
          title: person.name, // Title goes at root level, not in data
          data: {
            link: linkData
          }
        });

        console.log(`✅ Created: ${person.name} (${created.id})`);
        successCount++;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error creating ${person.name}:`, error.message);
        if (error.response) {
          console.error(`   Response:`, JSON.stringify(error.response, null, 2));
        }
        errorCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`✅ Successfully created: ${successCount} people`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${peopleData.slice(0, 3).length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
