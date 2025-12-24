// Christmas Card Generator Application
class ChristmasCardGenerator {
  constructor() {
    this.persons = [];
    this.selectedPerson = null;
    this.selectedStyle = null;
    this.currentCard = null;
    this.aiSession = null;

    this.init();
  }

  async init() {
    this.createSnow();
    await this.loadPersons();
    this.bindEvents();
    this.loadGallery();
    await this.initAI();
  }

  // Create falling snow effect
  createSnow() {
    const snowContainer = document.getElementById('snow');
    const snowflakes = ['❄', '❅', '❆', '✻', '✼'];

    for (let i = 0; i < 50; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
      snowflake.style.left = `${Math.random() * 100}%`;
      snowflake.style.animationDuration = `${Math.random() * 5 + 5}s`;
      snowflake.style.animationDelay = `${Math.random() * 5}s`;
      snowflake.style.fontSize = `${Math.random() * 1.5 + 0.5}em`;
      snowContainer.appendChild(snowflake);
    }
  }

  // Initialize AI (Google Nano Banana / Chrome Built-in AI)
  async initAI() {
    try {
      // Check for Chrome's built-in AI (Prompt API)
      if ('ai' in window && 'languageModel' in window.ai) {
        const capabilities = await window.ai.languageModel.capabilities();
        if (capabilities.available === 'readily' || capabilities.available === 'after-download') {
          this.aiSession = await window.ai.languageModel.create({
            systemPrompt: `You are a festive Christmas card greeting writer.
            Create warm, personalized holiday greetings that are cheerful and celebratory.
            Keep responses concise - 2-3 sentences max.
            Include festive language and holiday spirit.`
          });
          console.log('Google Nano Banana AI initialized successfully!');
          return;
        }
      }
      console.log('Chrome AI not available, using fallback mode');
    } catch (error) {
      console.log('AI initialization error:', error);
    }
  }

  // Load persons from API
  async loadPersons() {
    try {
      const response = await fetch('/api/persons');
      const data = await response.json();
      this.persons = data.persons;
      this.renderPersons();
      this.populateCategoryFilter(data.categories);
    } catch (error) {
      console.error('Failed to load persons:', error);
    }
  }

  // Populate category filter dropdown
  populateCategoryFilter(categories) {
    const filter = document.getElementById('category-filter');
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      filter.appendChild(option);
    });
  }

  // Render persons grid
  renderPersons(filteredPersons = null) {
    const grid = document.getElementById('persons-grid');
    const personsToRender = filteredPersons || this.persons;

    grid.innerHTML = personsToRender.map(person => `
      <div class="person-card ${this.selectedPerson?.id === person.id ? 'selected' : ''}"
           data-id="${person.id}">
        ${person.image
          ? `<img class="person-avatar" src="${person.image}" alt="${person.name}" onerror="this.outerHTML='<div class=\\'person-avatar placeholder\\'>${person.name.charAt(0)}</div>'">`
          : `<div class="person-avatar placeholder">${person.name.charAt(0)}</div>`
        }
        <div class="person-name">${person.name}</div>
        <div class="person-category">${person.category}</div>
      </div>
    `).join('');
  }

  // Bind all event listeners
  bindEvents() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchView(btn.dataset.view));
    });

    // Person selection
    document.getElementById('persons-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.person-card');
      if (card) this.selectPerson(card.dataset.id);
    });

    // Person search
    document.getElementById('person-search').addEventListener('input', (e) => {
      this.filterPersons(e.target.value, document.getElementById('category-filter').value);
    });

    // Category filter
    document.getElementById('category-filter').addEventListener('change', (e) => {
      this.filterPersons(document.getElementById('person-search').value, e.target.value);
    });

    // Style selection
    document.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => this.selectStyle(card.dataset.style));
    });

    // Generate button
    document.getElementById('generate-btn').addEventListener('click', () => this.generateCard());

    // Card actions
    document.getElementById('update-greeting').addEventListener('click', () => this.updateGreeting());
    document.getElementById('save-card').addEventListener('click', () => this.saveCard());
    document.getElementById('download-card').addEventListener('click', () => this.downloadCard());
    document.getElementById('new-card').addEventListener('click', () => this.resetGenerator());

    // Modal
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-download').addEventListener('click', () => this.downloadModalCard());
    document.getElementById('modal-delete').addEventListener('click', () => this.deleteModalCard());

    // Close modal on background click
    document.getElementById('card-modal').addEventListener('click', (e) => {
      if (e.target.id === 'card-modal') this.closeModal();
    });
  }

  // Switch between views
  switchView(view) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach(v => {
      v.classList.toggle('active', v.id === `${view}-view`);
    });

    if (view === 'gallery') {
      this.loadGallery();
    }
  }

  // Filter persons by search and category
  filterPersons(search, category) {
    let filtered = this.persons;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchLower));
    }

    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    this.renderPersons(filtered);
  }

  // Select a person
  selectPerson(id) {
    this.selectedPerson = this.persons.find(p => p.id === id);
    this.renderPersons();
    this.updateSummary();
  }

  // Select a style
  selectStyle(style) {
    this.selectedStyle = style;
    document.querySelectorAll('.style-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.style === style);
    });
    this.updateSummary();
  }

  // Update selection summary
  updateSummary() {
    const summary = document.getElementById('selection-summary');
    const generateBtn = document.getElementById('generate-btn');

    if (this.selectedPerson && this.selectedStyle) {
      summary.innerHTML = `<p><strong>Person:</strong> ${this.selectedPerson.name} | <strong>Style:</strong> ${this.selectedStyle}</p>`;
      summary.classList.add('ready');
      generateBtn.disabled = false;
    } else {
      const missing = [];
      if (!this.selectedPerson) missing.push('person');
      if (!this.selectedStyle) missing.push('style');
      summary.innerHTML = `<p>Please select a ${missing.join(' and ')}</p>`;
      summary.classList.remove('ready');
      generateBtn.disabled = true;
    }
  }

  // Generate Christmas card
  async generateCard() {
    const btn = document.getElementById('generate-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    btnText.hidden = true;
    btnLoading.hidden = false;
    btn.disabled = true;

    try {
      // Get card data from server
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: this.selectedPerson.id,
          personName: this.selectedPerson.name,
          style: this.selectedStyle
        })
      });

      const data = await response.json();
      this.currentCard = data.card;

      // Generate AI greeting
      let aiGreeting = await this.generateAIGreeting();

      // Draw the card
      await this.drawCard(aiGreeting);

      // Show result section
      document.getElementById('result-section').hidden = false;
      document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });

      // Show AI response
      if (aiGreeting) {
        document.getElementById('ai-message').textContent = aiGreeting;
        document.getElementById('ai-response').hidden = false;
      }

    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate card. Please try again.');
    } finally {
      btnText.hidden = false;
      btnLoading.hidden = true;
      btn.disabled = false;
    }
  }

  // Generate greeting using AI
  async generateAIGreeting() {
    const prompt = `Write a short, festive Christmas greeting for a card featuring ${this.selectedPerson.name}.
    Style: ${this.selectedStyle}. Make it fun and personalized to who they are.`;

    try {
      if (this.aiSession) {
        // Use Chrome's built-in AI
        const response = await this.aiSession.prompt(prompt);
        return response;
      }
    } catch (error) {
      console.log('AI greeting generation failed:', error);
    }

    // Fallback greetings
    const fallbackGreetings = {
      traditional: `Wishing ${this.selectedPerson.name} a magical Christmas filled with joy and wonder! May your holidays be merry and bright! 🎄`,
      modern: `Season's greetings from ${this.selectedPerson.name}! Here's to a stylish and sophisticated holiday season! ❄️`,
      funny: `${this.selectedPerson.name} says: "Who needs a chimney when you've got style!" Have a hilarious holiday! 🤣`,
      elegant: `With warmest wishes, ${this.selectedPerson.name} extends the most refined holiday greetings to you and yours. ✨`,
      tropical: `Aloha from ${this.selectedPerson.name}! Wishing you a warm and sunny Christmas wherever you are! 🌴`
    };

    return fallbackGreetings[this.selectedStyle] || fallbackGreetings.traditional;
  }

  // Draw the Christmas card on canvas
  async drawCard(greeting) {
    const canvas = document.getElementById('card-canvas');
    const ctx = canvas.getContext('2d');

    // Card dimensions
    canvas.width = 800;
    canvas.height = 600;

    // Background based on style
    const backgrounds = {
      traditional: { gradient: ['#1a472a', '#2d5a3a'], accent: '#c41e3a' },
      modern: { gradient: ['#1a1a2e', '#16213e'], accent: '#e8e8e8' },
      funny: { gradient: ['#ff6b6b', '#feca57'], accent: '#ffffff' },
      elegant: { gradient: ['#2c1810', '#4a2c2a'], accent: '#d4af37' },
      tropical: { gradient: ['#00b4d8', '#48cae4'], accent: '#ff9f1c' }
    };

    const style = backgrounds[this.selectedStyle] || backgrounds.traditional;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, style.gradient[0]);
    gradient.addColorStop(1, style.gradient[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw decorative elements based on style
    this.drawDecorations(ctx, this.selectedStyle, style.accent);

    // Draw "Merry Christmas" header
    ctx.fillStyle = style.accent;
    ctx.font = 'bold 48px "Mountains of Christmas", cursive, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Merry Christmas!', canvas.width / 2, 80);

    // Draw person's name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Inter", sans-serif';
    ctx.fillText(`From: ${this.selectedPerson.name}`, canvas.width / 2, 140);

    // Draw greeting text (wrapped)
    ctx.font = '22px "Inter", sans-serif';
    this.wrapText(ctx, greeting, canvas.width / 2, 480, canvas.width - 100, 30);

    // Store greeting for saving
    document.getElementById('greeting-input').value = greeting;
  }

  // Draw style-specific decorations
  drawDecorations(ctx, style, accentColor) {
    ctx.fillStyle = accentColor;
    ctx.strokeStyle = accentColor;

    switch (style) {
      case 'traditional':
        // Draw Christmas trees
        this.drawTree(ctx, 80, 350, 60);
        this.drawTree(ctx, 720, 350, 60);
        // Draw snowflakes
        for (let i = 0; i < 30; i++) {
          this.drawSnowflake(ctx, Math.random() * 800, Math.random() * 400 + 50, Math.random() * 10 + 5);
        }
        // Draw ornaments
        this.drawOrnaments(ctx);
        break;

      case 'modern':
        // Geometric shapes
        for (let i = 0; i < 15; i++) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(Math.random() * 800, Math.random() * 600, Math.random() * 50 + 20, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        break;

      case 'funny':
        // Silly elements
        ctx.font = '60px serif';
        ctx.fillText('🎅', 100, 300);
        ctx.fillText('🦌', 700, 300);
        ctx.fillText('🎁', 400, 350);
        ctx.font = '40px serif';
        ctx.fillText('🎄', 200, 400);
        ctx.fillText('⛄', 600, 400);
        break;

      case 'elegant':
        // Ornate borders
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 30, 740, 540);
        ctx.strokeRect(40, 40, 720, 520);
        // Corner decorations
        this.drawCornerDecoration(ctx, 50, 50);
        this.drawCornerDecoration(ctx, 750, 50, true);
        this.drawCornerDecoration(ctx, 50, 550, false, true);
        this.drawCornerDecoration(ctx, 750, 550, true, true);
        break;

      case 'tropical':
        // Palm trees and sun
        ctx.font = '80px serif';
        ctx.fillText('🌴', 50, 380);
        ctx.fillText('🌴', 700, 380);
        ctx.fillText('☀️', 400, 200);
        ctx.font = '50px serif';
        ctx.fillText('🌺', 150, 450);
        ctx.fillText('🌺', 650, 450);
        break;
    }
  }

  drawTree(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#165b33';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size / 2, y);
    ctx.lineTo(x + size / 2, y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - size * 1.5);
    ctx.lineTo(x - size / 2 * 0.8, y - size * 0.5);
    ctx.lineTo(x + size / 2 * 0.8, y - size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - 8, y, 16, 25);
    ctx.restore();
  }

  drawSnowflake(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawOrnaments(ctx) {
    const ornamentColors = ['#c41e3a', '#d4af37', '#1e90ff', '#9370db'];
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.fillStyle = ornamentColors[i % ornamentColors.length];
      ctx.beginPath();
      ctx.arc(100 + i * 90, 180 + Math.sin(i) * 20, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawCornerDecoration(ctx, x, y, flipX = false, flipY = false) {
    ctx.save();
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    if (flipY) ctx.scale(1, -1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(30, 0, 30, 30);
    ctx.quadraticCurveTo(30, 0, 60, 0);
    ctx.stroke();
    ctx.restore();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';

    for (let i = 0; i < words.length; i++) {
      testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, y);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, y);
  }

  // Update greeting on card
  updateGreeting() {
    const greeting = document.getElementById('greeting-input').value;
    this.drawCard(greeting);
  }

  // Save card to gallery
  async saveCard() {
    const canvas = document.getElementById('card-canvas');
    const imageData = canvas.toDataURL('image/png');
    const greeting = document.getElementById('greeting-input').value;

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.currentCard,
          imageData,
          greeting
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Card saved to gallery!');
        this.loadGallery();
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save card.');
    }
  }

  // Download card
  downloadCard() {
    const canvas = document.getElementById('card-canvas');
    const link = document.createElement('a');
    link.download = `christmas-card-${this.selectedPerson.name.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // Reset generator for new card
  resetGenerator() {
    this.selectedPerson = null;
    this.selectedStyle = null;
    this.currentCard = null;

    this.renderPersons();
    document.querySelectorAll('.style-card').forEach(card => card.classList.remove('selected'));
    this.updateSummary();
    document.getElementById('result-section').hidden = true;
    document.getElementById('ai-response').hidden = true;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Load gallery
  async loadGallery() {
    try {
      const response = await fetch('/api/cards');
      const cards = await response.json();

      const grid = document.getElementById('gallery-grid');
      const emptyMsg = document.getElementById('empty-gallery');

      if (cards.length === 0) {
        grid.innerHTML = '';
        emptyMsg.hidden = false;
        return;
      }

      emptyMsg.hidden = true;
      grid.innerHTML = cards.map(card => `
        <div class="gallery-card" data-id="${card.id}">
          <img src="${card.imagePath}" alt="Christmas Card for ${card.personName}">
          <div class="gallery-card-info">
            <h3>${card.personName}</h3>
            <p>${new Date(card.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      `).join('');

      // Bind click events
      grid.querySelectorAll('.gallery-card').forEach(card => {
        card.addEventListener('click', () => this.openModal(card.dataset.id, cards));
      });

    } catch (error) {
      console.error('Gallery load error:', error);
    }
  }

  // Open modal with card details
  openModal(cardId, cards) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    this.currentModalCard = card;

    document.getElementById('modal-image').src = card.imagePath;
    document.getElementById('modal-person').textContent = card.personName;
    document.getElementById('modal-greeting').textContent = card.greeting || '';
    document.getElementById('modal-date').textContent = `Created: ${new Date(card.createdAt).toLocaleString()}`;

    document.getElementById('card-modal').hidden = false;
  }

  // Close modal
  closeModal() {
    document.getElementById('card-modal').hidden = true;
    this.currentModalCard = null;
  }

  // Download card from modal
  downloadModalCard() {
    if (!this.currentModalCard) return;

    const link = document.createElement('a');
    link.download = `christmas-card-${this.currentModalCard.personName.replace(/\s+/g, '-')}.png`;
    link.href = this.currentModalCard.imagePath;
    link.click();
  }

  // Delete card from modal
  async deleteModalCard() {
    if (!this.currentModalCard) return;

    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const response = await fetch(`/api/cards/${this.currentModalCard.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        this.closeModal();
        this.loadGallery();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete card.');
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new ChristmasCardGenerator();
});
