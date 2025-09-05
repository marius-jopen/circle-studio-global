#!/usr/bin/env node

import { parse } from 'csv-parse/sync';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function exportCSVToJSON() {
  console.log('📊 Exporting CSV to JSON...');
  
  try {
    // Read the CSV file
    const csvPath = join(__dirname, '../input/Circle Studio Global Webpage Tracker.csv');
    const csvContent = readFileSync(csvPath, 'utf8');
    
    console.log('📁 CSV file loaded, size:', csvContent.length, 'characters');
    
    // Parse CSV with the same options we used before
    const records = parse(csvContent, {
      columns: ['Name', 'Instagram Link', 'Column3', 'Column4'],
      from_line: 2, // Skip header row
      skip_empty_lines: true,
      trim: true
    });
    
    // Remove the header row if it was included
    const filteredRecords = records.filter(record => 
      record.Name && 
      record.Name.trim() !== '' && 
      record.Name !== 'Name' // Remove header row
    );
    
    console.log('📈 Parsed records:', records.length);
    console.log('📈 Filtered records:', filteredRecords.length);
    
    // Filter out empty records and clean the data
    const peopleData = filteredRecords
      .filter(record => record.Name && record.Name.trim() !== '')
      .map((record, index) => {
        // Clean Instagram link (remove trailing # if present)
        let instagramLink = record['Instagram Link'] || '';
        if (instagramLink.endsWith('#')) {
          instagramLink = instagramLink.slice(0, -1);
        }
        
        // Generate UID from name (same logic as migration script)
        const uid = record.Name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
          .substring(0, 40); // Limit length for UID
        
        return {
          index: index + 1,
          name: record.Name.trim(),
          instagramLink: instagramLink,
          uid: uid,
          // Format for Prismic Migration API
          prismicFormat: {
            type: 'people',
            uid: uid,
            lang: 'en-us',
            title: record.Name.trim(),
            data: {
              link: instagramLink ? {
                link_type: 'Web',
                url: instagramLink
              } : {
                link_type: 'Any'
              }
            }
          }
        };
      });
    
    console.log('✅ Cleaned data:', peopleData.length, 'people');
    
    // Show first few records
    console.log('\n📋 First 5 records:');
    peopleData.slice(0, 5).forEach((person, i) => {
      console.log(`  ${i + 1}. ${person.name}`);
      console.log(`     Instagram: ${person.instagramLink || 'N/A'}`);
      console.log(`     UID: ${person.uid}`);
      console.log(`     Prismic format: ${JSON.stringify(person.prismicFormat, null, 2)}`);
      console.log('');
    });
    
    // Export to JSON files
    const outputDir = join(__dirname, '../output');
    
    // Create output directory if it doesn't exist
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    // Export full data
    const fullDataPath = join(outputDir, 'people-data.json');
    writeFileSync(fullDataPath, JSON.stringify(peopleData, null, 2));
    console.log('💾 Full data exported to:', fullDataPath);
    
    // Export just the Prismic format
    const prismicData = peopleData.map(p => p.prismicFormat);
    const prismicPath = join(outputDir, 'people-prismic-format.json');
    writeFileSync(prismicPath, JSON.stringify(prismicData, null, 2));
    console.log('💾 Prismic format exported to:', prismicPath);
    
    // Export summary
    const summary = {
      totalRecords: records.length,
      validPeople: peopleData.length,
      emptyRecords: records.length - peopleData.length,
      exportDate: new Date().toISOString(),
      fields: {
        name: 'Name (from CSV)',
        instagramLink: 'Instagram Link (from CSV)',
        uid: 'Generated UID (slugified name)',
        prismicFormat: 'Ready for Prismic Migration API'
      }
    };
    
    const summaryPath = join(outputDir, 'export-summary.json');
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('💾 Summary exported to:', summaryPath);
    
    console.log('\n🎉 Export complete!');
    console.log(`   Total CSV records: ${records.length}`);
    console.log(`   Valid people: ${peopleData.length}`);
    console.log(`   Empty records: ${records.length - peopleData.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

exportCSVToJSON().catch(console.error);
