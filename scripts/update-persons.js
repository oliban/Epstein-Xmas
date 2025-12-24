#!/usr/bin/env node

/**
 * Fetch persons from epstein-files-browser and update local data
 * Run periodically: npm run update-persons
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_URL = 'https://raw.githubusercontent.com/RhysSullivan/epstein-files-browser/main/celebrity-results.json';
const OUTPUT_PATH = join(__dirname, '..', 'data', 'persons.json');

// Known categories for notable persons
const CATEGORIES = {
  'Primary': ['Jeffrey Epstein', 'Ghislaine Maxwell', 'Jean-Luc Brunel', 'Sarah Kellen', 'Nadia Marcinkova'],
  'Political': ['Bill Clinton', 'Donald Trump', 'Prince Andrew', 'Ehud Barak', 'Larry Summers', 'Tony Blair',
                'George Mitchell', 'Bill Richardson', 'Andrés Pastrana Arango', 'Aníbal Acevedo Vilá'],
  'Business': ['Bill Gates', 'Elon Musk', 'Richard Branson', 'Les Wexner', 'Leon Black', 'Mort Zuckerman',
               'Frank Lowy', 'Brian Krzanich', 'David Portnoy', 'Henry Jarecki', 'John Brockman'],
  'Entertainment': ['Kevin Spacey', 'Chris Tucker', 'Naomi Campbell', 'Michael Jackson', 'Woody Allen',
                    'Mick Jagger', 'David Copperfield', 'Diana Ross', 'Brett Ratner', 'David Schwimmer',
                    'Frances McDormand', 'Anthony Bourdain'],
  'Science': ['Stephen Hawking', 'Albert Einstein', 'Marvin Minsky', 'Freeman Dyson', 'Gerald Edelman',
              'Benoit Mandelbrot', 'Fritz Haber', 'Dean Kamen'],
  'Legal': ['Alan Dershowitz', 'Ken Starr'],
  'Royalty': ['Prince Andrew', 'Anne', 'Gayatri Devi']
};

function getCategory(name) {
  for (const [category, names] of Object.entries(CATEGORIES)) {
    if (names.some(n => name.toLowerCase() === n.toLowerCase())) {
      return category;
    }
  }
  return 'Other';
}

function generateId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function cleanFilePath(filepath) {
  // Remove local path prefix
  const cleaned = filepath.replace('/Users/rhyssullivan/src/epstein-files-browser/files/', '');
  // Remove .pdf extension
  return cleaned.replace('.pdf', '');
}

async function fetchPersons() {
  console.log('Fetching persons from epstein-files-browser...');
  console.log(`Source: ${SOURCE_URL}\n`);

  try {
    // Use curl since fetch may not work in all environments
    let rawData;
    try {
      const result = execSync(`curl -s "${SOURCE_URL}"`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      rawData = JSON.parse(result);
    } catch (curlError) {
      // Fallback to fetch
      console.log('Curl failed, trying fetch...');
      const response = await fetch(SOURCE_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      rawData = await response.json();
    }

    // Extract unique celebrities and appearances from the data
    const uniqueCelebrities = rawData.uniqueCelebrities || [];
    const celebrityAppearances = rawData.celebrityAppearances || {};

    console.log(`Source data: ${rawData.totalImages} images, ${rawData.imagesWithCelebrities} with celebrities`);
    console.log(`Found ${uniqueCelebrities.length} unique persons\n`);

    // Create persons array with categories and appearances
    const persons = uniqueCelebrities.map(name => {
      const appearances = celebrityAppearances[name] || [];

      // Clean and sort appearances
      const cleanedAppearances = appearances
        .map(app => ({
          file: cleanFilePath(app.file),
          page: app.page,
          confidence: app.confidence
        }))
        .sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending

      return {
        id: generateId(name),
        name: name,
        category: getCategory(name),
        image: null,
        appearances: cleanedAppearances
      };
    });

    // Sort: Primary first, then by category, then alphabetically
    const categoryOrder = ['Primary', 'Political', 'Royalty', 'Business', 'Entertainment', 'Science', 'Legal', 'Other'];
    persons.sort((a, b) => {
      const catA = categoryOrder.indexOf(a.category);
      const catB = categoryOrder.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      return a.name.localeCompare(b.name);
    });

    // Get unique categories that actually exist in the data
    const allCategories = [...new Set(persons.map(p => p.category))];
    allCategories.sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

    // Ensure data directory exists
    const dataDir = dirname(OUTPUT_PATH);
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    // Build output
    const output = {
      lastUpdated: new Date().toISOString(),
      source: SOURCE_URL,
      sourceProcessedAt: rawData.processedAt,
      totalPersons: persons.length,
      categories: allCategories,
      persons
    };

    await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2));

    console.log(`Successfully updated: ${OUTPUT_PATH}`);
    console.log(`Total persons: ${persons.length}`);
    console.log(`Categories: ${allCategories.join(', ')}\n`);

    // Print category breakdown
    console.log('Category breakdown:');
    for (const cat of allCategories) {
      const count = persons.filter(p => p.category === cat).length;
      console.log(`  ${cat}: ${count}`);
    }

    // Print notable persons
    console.log('\nNotable persons found:');
    const notable = persons.filter(p => p.category !== 'Other').slice(0, 20);
    notable.forEach(p => {
      const appearanceCount = p.appearances.length;
      console.log(`  - ${p.name} (${p.category}) - ${appearanceCount} appearances`);
    });

  } catch (error) {
    console.error('Error fetching persons:', error.message);
    process.exit(1);
  }
}

fetchPersons();
