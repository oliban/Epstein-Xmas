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

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));
app.use('/gallery', express.static(join(__dirname, 'gallery')));

// Ensure gallery directory exists
const galleryDir = join(__dirname, 'gallery');
if (!existsSync(galleryDir)) {
  await mkdir(galleryDir, { recursive: true });
}

// API: Get list of persons
app.get('/api/persons', async (req, res) => {
  try {
    const data = await readFile(join(__dirname, 'data', 'persons.json'), 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load persons' });
  }
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

// API: Delete a card
app.delete('/api/cards/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { unlink } = await import('fs/promises');
    const imagePath = join(galleryDir, `${id}.png`);
    const metadataPath = join(galleryDir, `${id}.json`);

    if (existsSync(imagePath)) await unlink(imagePath);
    if (existsSync(metadataPath)) await unlink(metadataPath);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete card' });
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
