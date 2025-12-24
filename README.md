# 🎄 Epstein Files Christmas Card Generator

> *Spread holiday cheer with personalized Christmas cards featuring your favorite celebrities from the Epstein files! Nothing says "Season's Greetings" quite like declassified documents.*

A festive web application that transforms declassified Epstein court documents into shareable Christmas cards. Choose from various celebrities mentioned in the documents, select a festive style, add a personal greeting, and create memorable holiday greetings that are sure to spark conversation.

**Live Demo:** [epstein-xmas.fly.dev](https://epstein-xmas.fly.dev/)

---

## ✨ Features

### 🎯 Core Functionality
- **Multi-Person Selection**: Choose one or more people from the Epstein files
- **Smart Document Search**: Automatically finds document pages featuring selected individuals
- **Multiple Card Styles**:
  - No Style (plain document)
  - Personal Greeting Only
  - Traditional Christmas (snow, holly, fireplace)
  - Modern (minimalist design)
  - Funny (comedic elements)
  - Elegant (Victorian-style)
  - Tropical (beach Christmas)
- **Custom Greetings**: Add personalized messages to your cards
- **Gallery System**: Save and view your created cards
- **Page Navigation**: Browse through multiple matching document pages
- **Download & Share**: Export cards as images with social media preview support

### 📱 User Experience
- **Responsive Design**: Optimized for desktop and mobile devices
- **Smart Sticky Preview**: Card preview follows you on mobile when scrolling
- **Autocomplete Search**: Quick person lookup with fuzzy matching
- **Quick Links**: One-click access to notable persons
- **Category Filtering**: Browse persons by category
- **iOS Safari Compatible**: Includes polyfills for full iOS support
- **Festive Animations**: Snow effects and holiday decorations

### 🔍 Technical Features
- **Intelligent Matching**: Confidence-based scoring system for document relevance
- **CDN Integration**: Fast image loading from Cloudflare Workers
- **Persistent Storage**: Gallery saved to Fly.io volumes
- **Google Analytics**: Usage tracking and insights
- **Health Checks**: Automatic recovery and monitoring

---

## 🛠 Tech Stack

### Frontend
- **Vanilla JavaScript** (ES6+) - No frameworks, pure web standards
- **HTML5 Canvas** - Dynamic card rendering with overlays
- **CSS3** - Custom styling with animations and responsive design
- **Google Fonts** - Mountains of Christmas & Inter typefaces

### Backend
- **Node.js 18+** - ES modules
- **Express.js** - Web server and API
- **UUID** - Unique card identification

### Data Source
- **Epstein Files Browser** - Cloudflare Workers CDN
- **213KB JSON** - Pre-processed person metadata with confidence scores

### Infrastructure
- **Fly.io** - Serverless deployment with persistent volumes
- **Docker** - Alpine-based containerization (43MB image)
- **GitHub Actions** - Automated deployment (optional)

---

## 📁 Project Structure

```
Epstein-Xmas/
├── server.js                 # Express server with API endpoints
├── package.json             # Dependencies and scripts
├── Dockerfile               # Alpine-based production container
├── fly.toml                 # Fly.io deployment configuration
├── .dockerignore            # Docker build optimization
│
├── data/
│   └── persons.json         # 213KB person metadata (auto-generated)
│
├── public/                  # Static frontend files
│   ├── index.html          # Main HTML structure
│   ├── styles.css          # Responsive styling with animations
│   ├── app.js              # ~800 lines of application logic
│   └── preview.png         # Social media preview image (883KB)
│
├── scripts/
│   └── update-persons.js   # Fetch latest person data from CDN
│
└── gallery/                 # User-generated cards (persistent volume)
    ├── {uuid}.png          # Card images
    └── {uuid}.json         # Card metadata
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/oliban/Epstein-Xmas.git
cd Epstein-Xmas

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Start production server
npm start
```

---

## 📖 Usage

### Creating a Card

1. **Choose People**
   - Use quick links for notable persons
   - Type to search with autocomplete
   - Or browse all persons with category filtering
   - Select multiple people for combined results

2. **Browse Documents**
   - Click "Search" to find matching pages
   - Navigate between pages using arrow buttons
   - System automatically ranks pages by confidence score

3. **Select a Style**
   - Choose from 7 different card styles
   - Preview updates immediately
   - Styles range from plain to fully festive

4. **Add Personal Greeting**
   - Enter custom message (optional)
   - Default: "Merry Christmas and Happy New Year!"

5. **Save or Download**
   - Save to gallery for later viewing
   - Download as PNG image
   - Share on social media with automatic preview

### Gallery

- View all saved cards in the Gallery tab
- Click cards to view full-size with details
- Download any card from the modal view
- Cards persist across sessions (stored on server volume)

---

## 🔌 API Documentation

### `GET /api/persons`

Returns list of all persons mentioned in Epstein files.

**Response:**
```json
{
  "persons": [
    {
      "id": "jeffrey-epstein",
      "name": "Jeffrey Epstein",
      "category": "Key Figures",
      "appearances": 3450
    }
  ],
  "categories": ["Key Figures", "Politicians", "Celebrities", ...]
}
```

### `GET /api/search`

Search for document pages featuring specific persons.

**Query Parameters:**
- `person` (string or comma-separated) - Person ID(s) to search for

**Response:**
```json
{
  "pages": [
    {
      "imageUrl": "https://cdn.example.com/page.jpg",
      "matchedPersons": ["Jeffrey Epstein", "Bill Clinton"],
      "matchCount": 2,
      "confidence": 95.5
    }
  ],
  "totalPages": 327,
  "totalRequested": 1
}
```

**Scoring Algorithm:**
- Pages with multiple matching persons ranked higher
- Confidence scores from source data preserved
- Results sorted by composite score (matchCount × average confidence)

### `POST /api/gallery`

Save a card to the gallery.

**Request Body:**
```json
{
  "id": "uuid-v4",
  "personName": "Jeffrey Epstein",
  "style": "traditional",
  "greeting": "Happy Holidays!",
  "imageData": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "cardId": "uuid-v4"
}
```

### `GET /api/gallery`

List all saved cards.

**Response:**
```json
{
  "cards": [
    {
      "id": "uuid-v4",
      "personName": "Jeffrey Epstein",
      "style": "traditional",
      "greeting": "Happy Holidays!",
      "imageUrl": "/gallery/uuid-v4.png",
      "createdAt": "2025-12-24T20:00:00.000Z"
    }
  ]
}
```

---

## 💻 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Update persons data from source
npm run update-persons
```

### Development Workflow

1. **Frontend Changes**: Edit files in `public/` - refresh browser to see changes
2. **Backend Changes**: Use `npm run dev` for auto-restart on save
3. **Data Updates**: Run `npm run update-persons` to fetch latest person data

### Code Style

- **ES Modules**: All JavaScript uses `import/export`
- **No Build Step**: Vanilla JS/CSS served directly
- **Minimal Dependencies**: Only Express and UUID in production
- **No Frameworks**: Pure web standards for maximum compatibility

### Key Implementation Details

**UUID Generation Polyfill** (`public/app.js:8-18`)
```javascript
// Fallback for iOS Safari
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
```

**Smart Sticky Preview** (`public/app.js:304-346`)
- Only activates on mobile when scrolled past original position
- Automatic disable on desktop (>768px)
- Full viewport width on mobile for better visibility

**Document Search Algorithm** (`server.js:80-180`)
- Fetches all appearances for requested persons
- Calculates composite score: matchCount × average confidence
- Returns all matching pages sorted by relevance
- No arbitrary limits - client handles pagination

---

## 🚢 Deployment

### Fly.io Deployment

The application is configured for zero-downtime deployment to Fly.io with persistent gallery storage.

**Prerequisites:**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login
```

**Initial Deployment:**
```bash
# Create app (no deploy yet)
flyctl launch --no-deploy

# Create persistent volume for gallery
flyctl volumes create gallery_data --region iad --size 1

# Deploy
flyctl deploy

# Open in browser
flyctl open
```

**Configuration Highlights** (`fly.toml`):
- **Auto-stop/start**: Machines sleep when idle (cost savings)
- **256MB RAM**: Sufficient for lightweight application
- **1GB Volume**: ~1000 cards storage capacity
- **Health Checks**: Automatic recovery every 10s
- **Force HTTPS**: Automatic SSL/TLS

**Cost Estimate:**
- VM (auto-stop): $2-5/month
- 1GB Volume: $0.30/month
- **Total: ~$2-6/month** (potentially free with Fly.io free tier)

### Docker Build

```bash
# Build locally
docker build -t epstein-xmas .

# Run locally
docker run -p 3000:3000 epstein-xmas
```

**Image Specs:**
- Base: `node:18-alpine`
- Size: 45MB
- Non-root user: `node`
- Health check: Built-in HTTP ping

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (default: development)

### Volume Management

```bash
# Create snapshot backup
flyctl volumes snapshots create <volume-id>

# List backups
flyctl volumes snapshots list

# Expand storage if needed
flyctl volumes extend <volume-id> --size 3
```

---

## 📊 Analytics

Google Analytics is configured with measurement ID: `G-JVFBH51B4Q`

Tracked events:
- Page views
- Card creation flow
- Style selections
- Gallery interactions
- Download/save actions

---

## 🔧 Troubleshooting

### Common Issues

**Cards not saving:**
- Check gallery directory exists and is writable
- Verify volume is mounted correctly (Fly.io)
- Check browser console for errors

**Images not loading:**
- Verify CDN accessibility (epstein-files.rhys-669.workers.dev)
- Check network tab for 404 errors
- Some document pages may be missing from CDN

**iOS Safari issues:**
- UUID polyfill handles `crypto.randomUUID()` unavailability
- Touch events configured with `touch-action: manipulation`
- All async operations properly awaited

**Preview image not showing on social media:**
- Ensure `public/preview.png` exists
- Check meta tags in `index.html`
- Some platforms cache aggressively - use debugger tools

---

## 🤝 Contributing

This is a satirical holiday project. Contributions welcome for:
- Bug fixes
- UI/UX improvements
- Additional card styles
- Performance optimizations
- Mobile responsiveness enhancements

**Please note:** This project is intended as social commentary and satire. Maintain the tongue-in-cheek tone in all contributions.

---

## ⚠️ Disclaimer

This application is a work of **satire and social commentary**. It uses publicly available court documents from the Epstein case that have been declassified and are accessible through various public sources.

**Important Notes:**
- All document images are sourced from publicly available legal records
- Person data is extracted from these public documents
- This project does not make claims about individuals mentioned
- Intended for educational and satirical purposes only
- Not affiliated with any legal proceedings or official entities

The application demonstrates how public information can be recontextualized, raising questions about privacy, public records, and the nature of information in the digital age.

---

## 📄 License

This project is provided as-is for educational and satirical purposes. The code is open source, but users are responsible for ensuring their use complies with applicable laws and ethical standards.

Document images and metadata remain subject to their original legal status as public court records.

---

## 🙏 Acknowledgments

- Document source: [Epstein Files Browser](https://github.com/yourusername/epstein-files-browser) (Cloudflare Workers CDN)
- Hosted on: [Fly.io](https://fly.io)
- Fonts: [Google Fonts](https://fonts.google.com) (Mountains of Christmas, Inter)
- Built with: [Express.js](https://expressjs.com)

---

## 📞 Contact

For questions, issues, or feedback:
- Open an issue on GitHub
- Follow deployment at: [epstein-xmas.fly.dev](https://epstein-xmas.fly.dev/)

---

*Made with 🎄 and a sense of irony*
