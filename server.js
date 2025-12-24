import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload limit for canvas image data
app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(__dirname, 'public')));
app.use('/gallery', express.static(join(__dirname, 'gallery')));

// Ensure gallery directory exists
const galleryDir = join(__dirname, 'gallery');
if (!existsSync(galleryDir)) {
  await mkdir(galleryDir, { recursive: true });
}

// Load persons data
let personsData = null;
try {
  const data = await readFile(join(__dirname, 'data', 'persons.json'), 'utf-8');
  personsData = JSON.parse(data);
} catch (error) {
  console.error('Warning: Could not load persons data:', error.message);
}

// API: Get list of persons
app.get('/api/persons', async (req, res) => {
  try {
    if (personsData) {
      res.json(personsData);
    } else {
      const data = await readFile(join(__dirname, 'data', 'persons.json'), 'utf-8');
      personsData = JSON.parse(data);
      res.json(personsData);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load persons' });
  }
});

// Helper function to construct image URL from file path and page number
function constructImageUrl(filePath, pageNumber) {
  // filePath is already cleaned (no .pdf extension)
  const pageStr = String(pageNumber).padStart(3, '0');
  return `https://epstein-files.rhys-669.workers.dev/pdfs-as-jpegs/${filePath}/page-${pageStr}.jpg`;
}

// API: Find document page containing maximum number of selected persons
app.post('/api/find-page-with-persons', (req, res) => {
  const { personIds } = req.body;

  if (!personIds || personIds.length === 0) {
    return res.status(400).json({ error: 'personIds required' });
  }

  if (!personsData) {
    return res.status(500).json({ error: 'Persons data not loaded' });
  }

  // Load person data and appearances
  const persons = personIds.map(id =>
    personsData.persons.find(p => p.id === id)
  ).filter(p => p && p.appearances && p.appearances.length > 0);

  if (persons.length === 0) {
    return res.json({ imageUrl: null, matchCount: 0 });
  }

  // Build a map: pageKey -> { persons: Set(), appearances: [...] }
  const pageMap = new Map();

  persons.forEach(person => {
    person.appearances.forEach(app => {
      const pageKey = `${app.file}:${app.page}`;
      if (!pageMap.has(pageKey)) {
        pageMap.set(pageKey, { persons: new Set(), appearances: [] });
      }
      pageMap.get(pageKey).persons.add(person.name);
      pageMap.get(pageKey).appearances.push({ ...app, personName: person.name });
    });
  });

  // Calculate quality score for each page
  const scoredPages = [];
  for (const [pageKey, data] of pageMap.entries()) {
    const appearance = data.appearances[0];
    const matchCount = data.persons.size;

    // TIER 1: Exponential match count (dominates everything)
    let score = Math.pow(matchCount, 3) * 10000;

    // TIER 2: Quality bonuses (max ~200 points)
    if (appearance.page === 1) {
      score += 100;
    }

    // Penalty: High page numbers
    if (appearance.page >= 20) {
      score -= 50;
    } else if (appearance.page >= 10) {
      score -= 20;
    }

    // Bonus: High confidence
    if (appearance.confidence > 99.9) {
      score += 30;
    } else if (appearance.confidence > 99) {
      score += 15;
    }

    // TIER 3: Refined grid detection (-200 max)
    const personCounts = new Map();
    data.appearances.forEach(app => {
      personCounts.set(app.personName, (personCounts.get(app.personName) || 0) + 1);
    });

    const multipleDetections = Array.from(personCounts.values()).filter(count => count >= 2);
    const maxPersonCount = Math.max(...personCounts.values());

    let isGridLayout = false;
    if (personCounts.size === 1 && maxPersonCount >= 3) {
      // Single person, 3+ detections = grid catalog
      isGridLayout = true;
    } else if (multipleDetections.length >= 2) {
      // Multiple persons each appearing 2+ times = grid catalog
      isGridLayout = true;
    }

    if (isGridLayout) {
      score -= 200;
    }

    // TIER 4: Crowded page penalty (minor)
    if (data.appearances.length > 6) {
      score -= (data.appearances.length - 6) * 20;
    }

    scoredPages.push({
      data,
      appearance,
      matchCount,
      score,
      isGridLayout
    });
  }

  // Sort by score descending (multi-person pages first, then quality)
  scoredPages.sort((a, b) => b.score - a.score);

  // CRITICAL CHANGE: Return ALL pages, not just top 10%
  // This ensures all selected persons are represented in results
  const allPages = scoredPages;

  // Log summary
  console.log(`Returning ${allPages.length} total pages:`);
  const matchCountBreakdown = {};
  allPages.forEach(page => {
    matchCountBreakdown[page.matchCount] = (matchCountBreakdown[page.matchCount] || 0) + 1;
  });
  console.log('Pages by match count:', matchCountBreakdown);

  // Return all pages
  const pages = allPages.map(page => ({
    imageUrl: constructImageUrl(page.appearance.file, page.appearance.page),
    matchedPersons: Array.from(page.data.persons),
    matchCount: page.matchCount,
    confidence: page.appearance.confidence,
    score: page.score,
    isGridLayout: page.isGridLayout,
    file: page.appearance.file,
    page: page.appearance.page
  }));

  res.json({
    pages,
    totalPages: pages.length,
    totalRequested: personIds.length
  });
});

// API: Generate Christmas card
app.post('/api/generate', async (req, res) => {
  const { personId, personName, style } = req.body;

  if (!personId || !personName) {
    return res.status(400).json({ error: 'Person ID and name are required' });
  }

  try {
    // Generate the prompt for the AI
    const prompt = generateChristmasPrompt(personName, style);

    // Call Google Nano Banana API (Chrome's built-in AI)
    // The actual generation happens client-side using the Prompt API
    // Here we just return the prompt and card metadata

    const cardId = uuidv4();
    const card = {
      id: cardId,
      personId,
      personName,
      style: style || 'traditional',
      prompt,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      card,
      prompt
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate card' });
  }
});

// API: Save generated card
app.post('/api/cards', async (req, res) => {
  const { id, personId, personName, style, prompt, imageData, greeting } = req.body;

  if (!id || !imageData) {
    return res.status(400).json({ error: 'Card ID and image data are required' });
  }

  try {
    // Save image
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const imagePath = join(galleryDir, `${id}.png`);
    await writeFile(imagePath, imageBuffer);

    // Save metadata
    const metadataPath = join(galleryDir, `${id}.json`);
    const metadata = {
      id,
      personId,
      personName,
      style,
      prompt,
      greeting,
      imagePath: `/gallery/${id}.png`,
      createdAt: new Date().toISOString()
    };
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    res.json({ success: true, card: metadata });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save card' });
  }
});

// API: Get all saved cards
app.get('/api/cards', async (req, res) => {
  try {
    const files = await readdir(galleryDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const cards = await Promise.all(
      jsonFiles.map(async (file) => {
        const data = await readFile(join(galleryDir, file), 'utf-8');
        return JSON.parse(data);
      })
    );

    // Sort by creation date, newest first
    cards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(cards);
  } catch (error) {
    console.error('List error:', error);
    res.json([]);
  }
});

function generateChristmasPrompt(personName, style = 'traditional') {
  const styles = {
    traditional: {
      theme: 'traditional Christmas with snow, holly, and warm fireplace',
      colors: 'red, green, gold, and white',
      elements: 'Christmas tree, presents, stockings, and mistletoe'
    },
    modern: {
      theme: 'modern minimalist Christmas with clean lines',
      colors: 'silver, white, and ice blue',
      elements: 'geometric ornaments, simple pine branches, and elegant candles'
    },
    funny: {
      theme: 'humorous Christmas scene with comedic elements',
      colors: 'bright festive colors',
      elements: 'silly elves, dancing reindeer, and comical Santa situations'
    },
    elegant: {
      theme: 'sophisticated Victorian Christmas',
      colors: 'burgundy, gold, and cream',
      elements: 'ornate decorations, vintage ornaments, and classical elegance'
    },
    tropical: {
      theme: 'tropical Christmas beach celebration',
      colors: 'turquoise, coral, and sandy gold',
      elements: 'palm trees with lights, beach Santa, and tropical flowers'
    }
  };

  const selectedStyle = styles[style] || styles.traditional;

  return `Create a beautiful Christmas card featuring ${personName}.
Style: ${selectedStyle.theme}
Color palette: ${selectedStyle.colors}
Include: ${selectedStyle.elements}
The card should have a warm, festive atmosphere with space for a personalized greeting.
Make it cheerful and celebratory for the holiday season.`;
}

app.listen(PORT, () => {
  console.log(`🎄 Christmas Card Generator running at http://localhost:${PORT}`);
});
