// Christmas Card Generator Application
class ChristmasCardGenerator {
  constructor() {
    this.persons = [];
    this.selectedPersons = []; // Changed to array for multiple selection
    this.selectedStyle = null;
    this.currentCard = null;
    this.aiSession = null;
    this.highlightedIndex = -1;

    // Notable persons for quick links
    this.quickLinkIds = [
      'jeffrey-epstein', 'ghislaine-maxwell', 'bill-clinton', 'donald-trump',
      'prince-andrew-duke-of-york', 'richard-branson', 'les-wexner', 'chris-tucker',
      'david-copperfield', 'kevin-spacey', 'mick-jagger', 'naomi-campbell'
    ];

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
      this.renderQuickLinks();
      this.populateCategoryFilter(data.categories);
      this.renderSelectedChips();
    } catch (error) {
      console.error('Failed to load persons:', error);
    }
  }

  // Render quick links
  renderQuickLinks() {
    const container = document.getElementById('quick-links');
    const quickPersons = this.persons.filter(p =>
      this.quickLinkIds.includes(p.id) || p.category !== 'Other'
    ).slice(0, 15);

    container.innerHTML = quickPersons.map(person => `
      <button class="quick-link-btn ${this.isSelected(person.id) ? 'selected' : ''}"
              data-id="${person.id}">
        ${person.name}
      </button>
    `).join('');
  }

  // Check if person is selected
  isSelected(id) {
    return this.selectedPersons.some(p => p.id === id);
  }

  // Render selected persons as chips
  renderSelectedChips() {
    const container = document.getElementById('selected-chips');
    const clearBtn = document.getElementById('clear-all');

    if (this.selectedPersons.length === 0) {
      container.innerHTML = '<span style="color: #999; font-style: italic;">None selected</span>';
      clearBtn.hidden = true;
    } else {
      container.innerHTML = this.selectedPersons.map(person => `
        <span class="person-chip" data-id="${person.id}">
          ${person.name}
          <button class="remove-chip" data-id="${person.id}">&times;</button>
        </span>
      `).join('');
      clearBtn.hidden = false;
    }

    this.updateSummary();
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
      <div class="person-card ${this.isSelected(person.id) ? 'selected' : ''}"
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

    // Quick links
    document.getElementById('quick-links').addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-link-btn');
      if (btn) this.togglePerson(btn.dataset.id);
    });

    // Selected chips - remove button
    document.getElementById('selected-chips').addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-chip');
      if (removeBtn) {
        e.stopPropagation();
        this.removePerson(removeBtn.dataset.id);
      }
    });

    // Clear all button
    document.getElementById('clear-all').addEventListener('click', () => {
      this.clearAllPersons();
    });

    // Autocomplete input
    const autocompleteInput = document.getElementById('person-autocomplete');
    const dropdown = document.getElementById('autocomplete-dropdown');

    autocompleteInput.addEventListener('input', (e) => {
      this.handleAutocomplete(e.target.value);
    });

    autocompleteInput.addEventListener('focus', () => {
      if (autocompleteInput.value) {
        this.handleAutocomplete(autocompleteInput.value);
      }
    });

    autocompleteInput.addEventListener('keydown', (e) => {
      this.handleAutocompleteKeydown(e);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete-container')) {
        dropdown.hidden = true;
        this.highlightedIndex = -1;
      }
    });

    // Dropdown item click
    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.autocomplete-item');
      if (item) {
        this.togglePerson(item.dataset.id);
        autocompleteInput.value = '';
        autocompleteInput.focus();
        this.handleAutocomplete('');
      }
    });

    // Person selection in grid
    document.getElementById('persons-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.person-card');
      if (card) this.togglePerson(card.dataset.id);
    });

    // Person search (in browse all)
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

  // Handle autocomplete input
  handleAutocomplete(query) {
    const dropdown = document.getElementById('autocomplete-dropdown');

    if (!query.trim()) {
      dropdown.hidden = true;
      this.highlightedIndex = -1;
      return;
    }

    const queryLower = query.toLowerCase();
    const matches = this.persons.filter(p =>
      p.name.toLowerCase().includes(queryLower)
    ).slice(0, 10);

    if (matches.length === 0) {
      dropdown.innerHTML = '<div class="no-results">No matches found</div>';
    } else {
      dropdown.innerHTML = matches.map((person, index) => `
        <div class="autocomplete-item ${this.isSelected(person.id) ? 'selected' : ''} ${index === this.highlightedIndex ? 'highlighted' : ''}"
             data-id="${person.id}" data-index="${index}">
          <span class="name">${this.highlightMatch(person.name, query)}</span>
          <span class="category">${person.category}</span>
          ${this.isSelected(person.id) ? '<span class="checkmark">✓</span>' : ''}
        </div>
      `).join('');
    }

    dropdown.hidden = false;
    this.autocompleteMatches = matches;
  }

  // Highlight matching text
  highlightMatch(text, query) {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return text.slice(0, index) +
           '<strong>' + text.slice(index, index + query.length) + '</strong>' +
           text.slice(index + query.length);
  }

  // Handle keyboard navigation in autocomplete
  handleAutocompleteKeydown(e) {
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (dropdown.hidden || !this.autocompleteMatches) return;

    const matches = this.autocompleteMatches;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, matches.length - 1);
        this.updateHighlight();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        this.updateHighlight();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.highlightedIndex >= 0 && matches[this.highlightedIndex]) {
          this.togglePerson(matches[this.highlightedIndex].id);
          e.target.value = '';
          this.handleAutocomplete('');
        }
        break;
      case 'Escape':
        dropdown.hidden = true;
        this.highlightedIndex = -1;
        break;
    }
  }

  // Update highlight in dropdown
  updateHighlight() {
    const items = document.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === this.highlightedIndex);
    });

    // Scroll into view
    if (this.highlightedIndex >= 0 && items[this.highlightedIndex]) {
      items[this.highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  // Toggle person selection
  togglePerson(id) {
    const person = this.persons.find(p => p.id === id);
    if (!person) return;

    if (this.isSelected(id)) {
      this.removePerson(id);
    } else {
      this.selectedPersons.push(person);
      this.renderSelectedChips();
      this.renderQuickLinks();
      this.renderPersons();
      this.fetchAndPreview(); // Fetch image and show preview
    }
  }

  // Remove person from selection
  removePerson(id) {
    this.selectedPersons = this.selectedPersons.filter(p => p.id !== id);
    this.renderSelectedChips();
    this.renderQuickLinks();
    this.renderPersons();

    // Update autocomplete dropdown if open
    const input = document.getElementById('person-autocomplete');
    if (input.value) {
      this.handleAutocomplete(input.value);
    }

    this.fetchAndPreview(); // Update preview
  }

  // Clear all selected persons
  clearAllPersons() {
    this.selectedPersons = [];
    this.renderSelectedChips();
    this.renderQuickLinks();
    this.renderPersons();
    this.currentDocumentImage = null;
    document.getElementById('result-section').hidden = true;
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

  // Select a style
  selectStyle(style) {
    this.selectedStyle = style;
    document.querySelectorAll('.style-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.style === style);
    });
    this.updateSummary();
    this.updatePreview(); // Update preview with new style
  }

  // Update selection summary
  updateSummary() {
    const summary = document.getElementById('selection-summary');
    const generateBtn = document.getElementById('generate-btn');

    if (this.selectedPersons.length > 0 && this.selectedStyle) {
      const names = this.selectedPersons.map(p => p.name).join(', ');
      summary.innerHTML = `<p><strong>People:</strong> ${names}<br><strong>Style:</strong> ${this.selectedStyle}</p>`;
      summary.classList.add('ready');
      generateBtn.disabled = false;
    } else {
      const missing = [];
      if (this.selectedPersons.length === 0) missing.push('person(s)');
      if (!this.selectedStyle) missing.push('style');
      summary.innerHTML = `<p>Please select ${missing.join(' and ')}</p>`;
      summary.classList.remove('ready');
      generateBtn.disabled = true;
    }
  }

  // Get combined names string
  getPersonNames() {
    if (this.selectedPersons.length === 1) {
      return this.selectedPersons[0].name;
    } else if (this.selectedPersons.length === 2) {
      return `${this.selectedPersons[0].name} & ${this.selectedPersons[1].name}`;
    } else {
      const allButLast = this.selectedPersons.slice(0, -1).map(p => p.name).join(', ');
      return `${allButLast} & ${this.selectedPersons[this.selectedPersons.length - 1].name}`;
    }
  }

  // Fetch image and show preview immediately
  async fetchAndPreview() {
    if (this.selectedPersons.length === 0) {
      this.currentDocumentImage = null;
      document.getElementById('result-section').hidden = true;
      return;
    }

    if (!this.selectedStyle) {
      // If no style selected yet, just fetch the image but don't show preview
      await this.fetchDocumentImage();
      return;
    }

    // Fetch image and show preview
    try {
      await this.fetchDocumentImage();
      await this.updatePreview();
    } catch (error) {
      console.error('Preview error:', error);
      alert(error.message || 'Failed to load document image');
    }
  }

  // Update preview with current image and style (no re-fetch)
  async updatePreview() {
    if (!this.currentDocumentImage || !this.selectedStyle) {
      return;
    }

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
  }

  // Fetch document image (separated from card generation)
  async fetchDocumentImage() {
    const personIdsList = this.selectedPersons.map(p => p.id);

    const pageResponse = await fetch('/api/find-page-with-persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personIds: personIdsList })
    });

    const pageData = await pageResponse.json();

    // Validate response - NO FALLBACKS
    if (!pageData.imageUrl || pageData.matchCount === 0) {
      throw new Error('No document pages found for the selected persons');
    }

    // Fetch the actual image - throws error if fails
    const imgResponse = await fetch(pageData.imageUrl);
    if (!imgResponse.ok) {
      throw new Error(`Failed to load document image (HTTP ${imgResponse.status})`);
    }

    const blob = await imgResponse.blob();
    this.currentDocumentImage = await this.createImageFromBlob(blob);

    // Log match info
    console.log(`Found ${pageData.matchCount}/${pageData.totalRequested} persons on page`);
    console.log(`Matched persons: ${pageData.matchedPersons.join(', ')}`);
  }

  // Generate Christmas card (fetch new random page)
  async generateCard() {
    const btn = document.getElementById('generate-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    btnText.hidden = true;
    btnLoading.hidden = false;
    btn.disabled = true;

    try {
      const personNames = this.getPersonNames();
      const personIds = this.selectedPersons.map(p => p.id).join(',');

      // Get card data from server
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: personIds,
          personName: personNames,
          style: this.selectedStyle
        })
      });

      const data = await response.json();
      this.currentCard = data.card;

      // Fetch new random document image and update preview
      await this.fetchDocumentImage();
      await this.updatePreview();

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
    const names = this.getPersonNames();
    const prompt = `Write a short, festive Christmas greeting for a card featuring ${names}.
    Style: ${this.selectedStyle}. Make it fun and personalized to who they are.`;

    try {
      if (this.aiSession) {
        const response = await this.aiSession.prompt(prompt);
        return response;
      }
    } catch (error) {
      console.log('AI greeting generation failed:', error);
    }

    // Fallback greetings
    const fallbackGreetings = {
      traditional: `Wishing ${names} a magical Christmas filled with joy and wonder! May your holidays be merry and bright!`,
      modern: `Season's greetings from ${names}! Here's to a stylish and sophisticated holiday season!`,
      funny: `${names} says: "Who needs a chimney when you've got style!" Have a hilarious holiday!`,
      elegant: `With warmest wishes, ${names} extends the most refined holiday greetings to you and yours.`,
      tropical: `Aloha from ${names}! Wishing you a warm and sunny Christmas wherever you are!`
    };

    return fallbackGreetings[this.selectedStyle] || fallbackGreetings.traditional;
  }

  // Draw the Christmas card on canvas
  async drawCard(greeting) {
    const canvas = document.getElementById('card-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 800;
    canvas.height = 600;

    const backgrounds = {
      traditional: { gradient: ['#1a472a', '#2d5a3a'], accent: '#c41e3a', overlay: 'rgba(26, 71, 42, 0.35)' },
      modern: { gradient: ['#1a1a2e', '#16213e'], accent: '#e8e8e8', overlay: 'rgba(26, 26, 46, 0.4)' },
      funny: { gradient: ['#ff6b6b', '#feca57'], accent: '#ffffff', overlay: 'rgba(255, 107, 107, 0.3)' },
      elegant: { gradient: ['#2c1810', '#4a2c2a'], accent: '#d4af37', overlay: 'rgba(44, 24, 16, 0.35)' },
      tropical: { gradient: ['#00b4d8', '#48cae4'], accent: '#ff9f1c', overlay: 'rgba(0, 180, 216, 0.3)' }
    };

    const style = backgrounds[this.selectedStyle] || backgrounds.traditional;

    // Draw document page as background (must exist - error thrown earlier if not)
    this.drawDocumentBackground(ctx, this.currentDocumentImage, canvas.width, canvas.height);

    // Apply overlay for text readability
    ctx.fillStyle = style.overlay;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw decorative elements
    this.drawDecorations(ctx, this.selectedStyle, style.accent);

    // Draw header
    ctx.fillStyle = style.accent;
    ctx.font = 'bold 48px "Mountains of Christmas", cursive, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Merry Christmas!', canvas.width / 2, 80);

    // Draw person names
    ctx.fillStyle = '#ffffff';
    const names = this.getPersonNames();
    const fontSize = names.length > 40 ? 28 : 36;
    ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
    this.wrapText(ctx, `From: ${names}`, canvas.width / 2, 140, canvas.width - 80, fontSize + 8);

    // Draw greeting text
    ctx.font = '22px "Inter", sans-serif';
    this.wrapText(ctx, greeting, canvas.width / 2, 480, canvas.width - 100, 30);

    document.getElementById('greeting-input').value = greeting;
  }

  // Draw style-specific decorations
  drawDecorations(ctx, style, accentColor) {
    ctx.fillStyle = accentColor;
    ctx.strokeStyle = accentColor;

    switch (style) {
      case 'traditional':
        this.drawTree(ctx, 80, 350, 60);
        this.drawTree(ctx, 720, 350, 60);
        for (let i = 0; i < 30; i++) {
          this.drawSnowflake(ctx, Math.random() * 800, Math.random() * 400 + 50, Math.random() * 10 + 5);
        }
        this.drawOrnaments(ctx);
        break;
      case 'modern':
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
        ctx.font = '60px serif';
        ctx.fillText('🎅', 100, 300);
        ctx.fillText('🦌', 700, 300);
        ctx.fillText('🎁', 400, 350);
        ctx.font = '40px serif';
        ctx.fillText('🎄', 200, 400);
        ctx.fillText('⛄', 600, 400);
        break;
      case 'elegant':
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 30, 740, 540);
        ctx.strokeRect(40, 40, 720, 520);
        this.drawCornerDecoration(ctx, 50, 50);
        this.drawCornerDecoration(ctx, 750, 50, true);
        this.drawCornerDecoration(ctx, 50, 550, false, true);
        this.drawCornerDecoration(ctx, 750, 550, true, true);
        break;
      case 'tropical':
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

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
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

  // Create an Image element from a Blob
  createImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Draw document page as background, maintaining aspect ratio
  drawDocumentBackground(ctx, image, width, height) {
    // Cover canvas while maintaining aspect ratio
    const imgRatio = image.width / image.height;
    const canvasRatio = width / height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      // Image wider - fit to height
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Image taller - fit to width
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    }

    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  }

  updateGreeting() {
    const greeting = document.getElementById('greeting-input').value;
    this.drawCard(greeting);
  }

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

  downloadCard() {
    const canvas = document.getElementById('card-canvas');
    const link = document.createElement('a');
    const names = this.getPersonNames().replace(/[,\s&]+/g, '-');
    link.download = `christmas-card-${names}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  resetGenerator() {
    this.selectedPersons = [];
    this.selectedStyle = null;
    this.currentCard = null;

    this.renderSelectedChips();
    this.renderQuickLinks();
    this.renderPersons();
    document.querySelectorAll('.style-card').forEach(card => card.classList.remove('selected'));
    this.updateSummary();
    document.getElementById('result-section').hidden = true;
    document.getElementById('ai-response').hidden = true;
    document.getElementById('person-autocomplete').value = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

      grid.querySelectorAll('.gallery-card').forEach(card => {
        card.addEventListener('click', () => this.openModal(card.dataset.id, cards));
      });

    } catch (error) {
      console.error('Gallery load error:', error);
    }
  }

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

  closeModal() {
    document.getElementById('card-modal').hidden = true;
    this.currentModalCard = null;
  }

  downloadModalCard() {
    if (!this.currentModalCard) return;

    const link = document.createElement('a');
    link.download = `christmas-card-${this.currentModalCard.personName.replace(/\s+/g, '-')}.png`;
    link.href = this.currentModalCard.imagePath;
    link.click();
  }

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
