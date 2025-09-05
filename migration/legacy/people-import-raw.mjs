#!/usr/bin/env node

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
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
          title: row.Name.trim(), // Use title instead of name
          instagramLink: instagramLink
        };
      })
      .filter(person => person.title && person.title !== 'Name'); // Remove header row and empty names

    console.log(`👥 Processing ${peopleData.length} people`);

    if (dryRun) {
      console.log('\n🔍 DRY RUN - Would create the following people:');
      peopleData.slice(0, 10).forEach((person, index) => {
        console.log(`${index + 1}. ${person.title}${person.instagramLink ? ` (${person.instagramLink})` : ''}`);
      });
      if (peopleData.length > 10) {
        console.log(`... and ${peopleData.length - 10} more`);
      }
      console.log('\nTo apply changes, run with --dry-run=false');
      return;
    }

    // Create people using raw HTTP requests (test with first person only)
    let successCount = 0;
    let errorCount = 0;

    for (const person of peopleData.slice(0, 1)) {
      try {
        // Generate UID from title (lowercase, replace spaces with hyphens, remove special chars)
        const uid = person.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
          .substring(0, 40) // Limit length for UID
          + '-' + Date.now(); // Add timestamp for testing

        // Prepare link data
        const linkData = person.instagramLink ? {
          link_type: 'Web',
          url: person.instagramLink
        } : {
          link_type: 'Any'
        };

        // Create document using raw HTTP
        console.log(`🔍 Creating document for ${person.title}...`);
        
        const documentData = {
          type: 'people',
          uid: uid,
          lang: 'en-us',
          title: person.title, // Title at root level
          data: {
            link: linkData
          }
        };

        const response = await fetch('https://migration.prismic.io/documents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PRISMIC_WRITE_TOKEN}`,
            'repository': REPOSITORY_NAME,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(documentData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Created: ${person.title} (${result.id})`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.error(`❌ Error creating ${person.title}: ${response.status} ${response.statusText}`);
          console.error(`   Response: ${errorText}`);
          errorCount++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error creating ${person.title}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${peopleData.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
