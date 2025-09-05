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

async function findFinalProject() {
  console.log('🔍 Finding "The Final" Project in Prismic');
  console.log('==========================================\n');
  
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ PRISMIC_ACCESS_TOKEN is required');
    return;
  }

  try {
    // First, get all projects
    console.log('📋 Fetching all projects...');
    const projectsResponse = await fetch(
      `https://${REPOSITORY_NAME}.prismic.io/api/v2/documents/search?ref=aLrZAREAAB8Afc5I&q=[[at(document.type,"projects")]]&pageSize=100`,
      {
        headers: {
          'Authorization': `Token ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text();
      throw new Error(`Failed to fetch projects: ${projectsResponse.status} ${projectsResponse.statusText} - ${errorText}`);
    }

    const projectsData = await projectsResponse.json();
    const projects = projectsData.results || [];
    
    console.log(`✅ Found ${projects.length} projects in Prismic`);

    // Search for "The Final" project
    console.log('\n🔍 Searching for "The Final" project...');
    const finalProjects = projects.filter(project => {
      const title = project.data.title || '';
      return title.toLowerCase().includes('final');
    });

    if (finalProjects.length === 0) {
      console.log('❌ No projects found with "final" in the title');
      console.log('\n📋 All project titles:');
      projects.forEach((project, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. "${project.data.title || 'No title'}" (${project.id})`);
      });
    } else {
      console.log(`✅ Found ${finalProjects.length} project(s) with "final" in the title:`);
      finalProjects.forEach((project, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. "${project.data.title}" (${project.id})`);
        console.log(`     UID: ${project.uid}`);
        console.log(`     Type: ${project.type}`);
      });
    }

    // Also search for projects with "The" in the title
    console.log('\n🔍 Searching for projects with "The" in the title...');
    const theProjects = projects.filter(project => {
      const title = project.data.title || '';
      return title.toLowerCase().startsWith('the ');
    });

    if (theProjects.length > 0) {
      console.log(`✅ Found ${theProjects.length} project(s) starting with "The":`);
      theProjects.forEach((project, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. "${project.data.title}" (${project.id})`);
        console.log(`     UID: ${project.uid}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findFinalProject().catch(console.error);
