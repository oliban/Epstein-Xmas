// UUID generator polyfill for iOS Safari
function generateUUID() {
  // Try native crypto.randomUUID first
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for iOS Safari and older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Christmas Card Generator Application
class ChristmasCardGenerator {
  constructor() {
    this.persons = [];
    this.selectedPersons = []; // Changed to array for multiple selection
    this.selectedStyle = null;
    this.currentCard = null;
    this.aiSession = null;
    this.highlightedIndex = -1;
    this.currentDocumentImage = null;
    this.matchedPages = []; // All matching pages from search
    this.currentPageIndex = 0; // Current page being viewed

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

    // Show fewer quick links on mobile
    const isMobile = window.innerWidth <= 768;
    const maxQuickLinks = isMobile ? 6 : 15;

    const quickPersons = this.persons.filter(p =>
      this.quickLinkIds.includes(p.id) || p.category !== 'Other'
    ).slice(0, maxQuickLinks);

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
    const selectedPersonsSection = document.getElementById('selected-persons');

    if (this.selectedPersons.length === 0) {
      selectedPersonsSection.hidden = true;
    } else {
      selectedPersonsSection.hidden = false;
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

    // Style selection - single handler works for both touch and click
    document.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectStyle(card.dataset.style);
      });
    });

    // How it works - scroll to search
    document.getElementById('how-it-works').addEventListener('click', () => {
      document.getElementById('search-btn').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Card actions
    // Live update greeting as user types
    document.getElementById('greeting-input').addEventListener('input', () => {
      const greeting = document.getElementById('greeting-input').value || 'Merry Christmas and Happy New Year!';
      if (this.currentDocumentImage && this.selectedStyle) {
        this.drawCard(greeting);
      }
    });
    document.getElementById('save-card').addEventListener('click', () => this.saveCard());
    document.getElementById('download-card').addEventListener('click', () => this.downloadCard());
    document.getElementById('new-card').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear this card and start over?')) {
        this.resetGenerator();
      }
    });

    // Footer navigation
    document.querySelectorAll('.footer-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView(link.dataset.view);
      });
    });

    // Sticky card preview on mobile scroll
    this.setupStickyPreview();

    // Modal
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-download').addEventListener('click', () => this.downloadModalCard());

    // Close modal on background click
    document.getElementById('card-modal').addEventListener('click', (e) => {
      if (e.target.id === 'card-modal') this.closeModal();
    });

    // Search button - execute search and fetch image
    document.getElementById('search-btn').addEventListener('click', () => {
      this.fetchAndPreview();
    });

    // Page navigation buttons
    document.getElementById('prev-page').addEventListener('click', () => {
      this.previousPage();
    });
    document.getElementById('next-page').addEventListener('click', () => {
      this.nextPage();
    });

    // Click on preview canvas to open modal
    document.getElementById('card-canvas').addEventListener('click', () => {
      this.openPreviewModal();
    });

    // Make canvas clickable with pointer cursor
    document.getElementById('card-canvas').style.cursor = 'pointer';

    // Re-render quick links on window resize (mobile/desktop switch)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.renderQuickLinks();
      }, 200); // Debounce resize events
    });
  }

  // Setup sticky preview on mobile when scrolling past
  setupStickyPreview() {
    const preview = document.getElementById('card-preview');
    if (!preview) return;

    let previewTop = 0;
    let isSticky = false;

    const updateStickyState = () => {
      // Only apply on mobile
      if (window.innerWidth > 768) {
        preview.classList.remove('sticky-active');
        return;
      }

      // Get the preview's original position (when not sticky)
      if (!isSticky) {
        const rect = preview.getBoundingClientRect();
        previewTop = rect.top + window.scrollY;
      }

      // Check if we've scrolled past the preview
      const scrollPosition = window.scrollY;

      if (scrollPosition > previewTop - 10 && !isSticky) {
        preview.classList.add('sticky-active');
        isSticky = true;
      } else if (scrollPosition <= previewTop - 10 && isSticky) {
        preview.classList.remove('sticky-active');
        isSticky = false;
      }
    };

    // Update on scroll
    window.addEventListener('scroll', updateStickyState);

    // Recalculate on resize
    window.addEventListener('resize', () => {
      isSticky = false;
      preview.classList.remove('sticky-active');
      setTimeout(updateStickyState, 100);
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
      this.updateSearchButton();
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

    this.updateSearchButton();
  }

  // Update search button state
  updateSearchButton() {
    const searchBtn = document.getElementById('search-btn');
    searchBtn.disabled = this.selectedPersons.length === 0;
  }

  // Clear all selected persons
  clearAllPersons() {
    this.selectedPersons = [];
    this.renderSelectedChips();
    this.renderQuickLinks();
    this.renderPersons();
    this.currentDocumentImage = null;
    document.getElementById('result-section').hidden = true;
    this.updateSearchButton();
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
  async selectStyle(style) {
    this.selectedStyle = style;
    document.querySelectorAll('.style-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.style === style);
    });

    // Create card object for saving (needed when using search workflow)
    if (this.selectedPersons.length > 0) {
      const personIds = this.selectedPersons.map(p => p.id).join(',');
      const personNames = this.selectedPersons.map(p => p.name).join(', ');

      this.currentCard = {
        id: generateUUID(),
        personId: personIds,
        personName: personNames,
        style: style,
        prompt: `Christmas card for ${personNames} in ${style} style`,
        createdAt: new Date().toISOString()
      };
    }

    this.updateSummary();
    await this.updatePreview(); // Update preview with new style
  }

  // Update button states and visibility
  updateSummary() {
    const greetingSection = document.getElementById('greeting-section');

    // Show greeting section if we have a preview
    if (this.currentDocumentImage) {
      greetingSection.hidden = false;
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
    console.log('=== fetchAndPreview called ===');
    console.log('Selected persons:', this.selectedPersons.map(p => p.name));

    if (this.selectedPersons.length === 0) {
      this.currentDocumentImage = null;
      document.getElementById('result-section').hidden = true;
      return;
    }

    // Fetch image and show it (with or without style)
    try {
      await this.fetchDocumentImage();

      // Show the document image
      await this.showDocumentImage();

      // If style is selected, add decorations
      if (this.selectedStyle) {
        await this.updatePreview();
      }

      console.log('=== fetchAndPreview completed ===');
    } catch (error) {
      console.error('Preview error:', error);
      alert(error.message || 'Failed to load document image');
    }
  }

  // Show raw document image without decorations
  async showDocumentImage() {
    if (!this.currentDocumentImage) return;

    const canvas = document.getElementById('card-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 800;
    canvas.height = 600;

    // Draw just the document image, no decorations
    this.drawDocumentBackground(ctx, this.currentDocumentImage, canvas.width, canvas.height);

    // Show result section without scrolling (keeps search button visible)
    document.getElementById('result-section').hidden = false;

    // Reveal Step 2 (styles) and Step 3 (actions) after successful search
    document.getElementById('step-2').hidden = false;
    document.getElementById('step-3').hidden = false;
    document.getElementById('greeting-section').hidden = false;

    // Auto-select "none" style as default if no style selected yet
    if (!this.selectedStyle) {
      this.selectStyle('none');
    }
  }

  // Update preview with current image and style (no re-fetch)
  async updatePreview() {
    if (!this.currentDocumentImage || !this.selectedStyle) {
      return;
    }

    // Get current greeting from textarea, or use default
    const greeting = document.getElementById('greeting-input').value || 'Merry Christmas and Happy New Year!';

    // Draw the card
    await this.drawCard(greeting);

    // Show result section
    document.getElementById('result-section').hidden = false;

    // Only scroll to preview on desktop (on mobile it's sticky and always visible)
    if (window.innerWidth > 768) {
      document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Fetch document image (separated from card generation)
  async fetchDocumentImage() {
    const personIdsList = this.selectedPersons.map(p => p.id);

    const pageResponse = await fetch('/api/find-page-with-persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personIds: personIdsList }),
      cache: 'no-cache'
    });

    if (!pageResponse.ok) {
      throw new Error(`API error: ${pageResponse.status}`);
    }

    const pageData = await pageResponse.json();
    console.log('Received page data:', pageData);

    // Validate response - NO FALLBACKS
    if (!pageData.pages || pageData.pages.length === 0) {
      throw new Error('No document pages found for the selected persons');
    }

    // Store all matched pages
    this.matchedPages = pageData.pages;

    // Start at random page, with fallback if image fails to load
    this.currentPageIndex = Math.floor(Math.random() * this.matchedPages.length);
    const startIndex = this.currentPageIndex;
    let loaded = false;
    let attempts = 0;

    // Try to load an image, skipping broken ones
    while (!loaded && attempts < this.matchedPages.length) {
      try {
        await this.loadPageAtIndex(this.currentPageIndex);
        loaded = true;
      } catch (error) {
        console.warn(`Failed to load page ${this.currentPageIndex + 1}, trying next...`);
        this.currentPageIndex = (this.currentPageIndex + 1) % this.matchedPages.length;
        attempts++;

        if (this.currentPageIndex === startIndex && attempts > 0) {
          throw new Error('All images failed to load from CDN');
        }
      }
    }

    // Update navigation UI
    this.updateNavigationUI();

    console.log(`Found ${this.matchedPages.length} matching pages, starting at ${this.currentPageIndex + 1}`);
  }

  async loadPageAtIndex(index) {
    const page = this.matchedPages[index];
    if (!page) return;

    console.log(`Loading page ${index + 1}/${this.matchedPages.length} from ${page.imageUrl}`);

    // Fetch the image
    const imgResponse = await fetch(page.imageUrl, { cache: 'no-cache' });
    if (!imgResponse.ok) {
      throw new Error(`Failed to load document image (HTTP ${imgResponse.status})`);
    }

    const blob = await imgResponse.blob();
    this.currentDocumentImage = await this.createImageFromBlob(blob);

    console.log(`Loaded page ${index + 1}/${this.matchedPages.length}: ${page.matchedPersons.join(', ')} (confidence: ${page.confidence.toFixed(1)}%)`);
  }

  async nextPage() {
    if (this.matchedPages.length === 0) return;

    const startIndex = this.currentPageIndex;
    let attempts = 0;
    const maxAttempts = this.matchedPages.length;

    while (attempts < maxAttempts) {
      this.currentPageIndex = (this.currentPageIndex + 1) % this.matchedPages.length;

      try {
        await this.loadPageAtIndex(this.currentPageIndex);
        this.updateNavigationUI();

        // Redraw with current style if selected
        if (this.selectedStyle) {
          await this.updatePreview();
        } else {
          await this.showDocumentImage();
        }
        return; // Success - exit loop
      } catch (error) {
        console.warn(`Failed to load page ${this.currentPageIndex + 1}, trying next...`);
        attempts++;

        // If we've tried all pages, stop
        if (this.currentPageIndex === startIndex) {
          console.error('All pages failed to load');
          alert('Unable to load any images. The CDN may be experiencing issues.');
          return;
        }
      }
    }
  }

  async previousPage() {
    if (this.matchedPages.length === 0) return;

    const startIndex = this.currentPageIndex;
    let attempts = 0;
    const maxAttempts = this.matchedPages.length;

    while (attempts < maxAttempts) {
      this.currentPageIndex = (this.currentPageIndex - 1 + this.matchedPages.length) % this.matchedPages.length;

      try {
        await this.loadPageAtIndex(this.currentPageIndex);
        this.updateNavigationUI();

        // Redraw with current style if selected
        if (this.selectedStyle) {
          await this.updatePreview();
        } else {
          await this.showDocumentImage();
        }
        return; // Success - exit loop
      } catch (error) {
        console.warn(`Failed to load page ${this.currentPageIndex + 1}, trying previous...`);
        attempts++;

        // If we've tried all pages, stop
        if (this.currentPageIndex === startIndex) {
          console.error('All pages failed to load');
          alert('Unable to load any images. The CDN may be experiencing issues.');
          return;
        }
      }
    }
  }

  updateNavigationUI() {
    const counter = document.getElementById('page-counter');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (this.matchedPages.length > 0) {
      counter.textContent = `${this.currentPageIndex + 1} of ${this.matchedPages.length}`;
      counter.hidden = false;
      prevBtn.hidden = false;
      nextBtn.hidden = false;
    } else {
      counter.hidden = true;
      prevBtn.hidden = true;
      nextBtn.hidden = true;
    }
  }

  // Removed generateCard() method - Random new image button was removed from UI

  // Draw the Christmas card on canvas
  async drawCard(greeting) {
    const canvas = document.getElementById('card-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 800;
    canvas.height = 600;

    // Draw document page as background (must exist - error thrown earlier if not)
    this.drawDocumentBackground(ctx, this.currentDocumentImage, canvas.width, canvas.height);

    // Handle "none" style - just the document, nothing else
    if (this.selectedStyle === 'none') {
      return;
    }

    // Handle "greeting-only" style - document + greeting text only
    if (this.selectedStyle === 'greeting-only') {
      // Light overlay for text readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw greeting text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      this.wrapText(ctx, greeting, canvas.width / 2, canvas.height / 2, canvas.width - 100, 40);
      ctx.shadowColor = 'transparent';

      document.getElementById('greeting-input').value = greeting;
      return;
    }

    // Handle Christmas styles (traditional, modern, funny, elegant, tropical)
    const backgrounds = {
      traditional: { gradient: ['#1a472a', '#2d5a3a'], accent: '#c41e3a', overlay: 'rgba(26, 71, 42, 0.35)' },
      modern: { gradient: ['#1a1a2e', '#16213e'], accent: '#e8e8e8', overlay: 'rgba(26, 26, 46, 0.4)' },
      funny: { gradient: ['#ff6b6b', '#feca57'], accent: '#ffffff', overlay: 'rgba(255, 107, 107, 0.3)' },
      elegant: { gradient: ['#2c1810', '#4a2c2a'], accent: '#d4af37', overlay: 'rgba(44, 24, 16, 0.35)' },
      tropical: { gradient: ['#00b4d8', '#48cae4'], accent: '#ff9f1c', overlay: 'rgba(0, 180, 216, 0.3)' }
    };

    const style = backgrounds[this.selectedStyle] || backgrounds.traditional;

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

  async saveCard() {
    const canvas = document.getElementById('card-canvas');
    const imageData = canvas.toDataURL('image/png');
    const greeting = document.getElementById('greeting-input').value;
    const saveBtn = document.getElementById('save-card');
    const originalText = saveBtn.textContent;

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
        // Sparkly success effect
        saveBtn.classList.add('sparkle-success');
        saveBtn.textContent = 'Saved! ✨';

        // Create sparkle particles
        this.createSparkles(saveBtn);

        // Reset after animation
        setTimeout(() => {
          saveBtn.classList.remove('sparkle-success');
          saveBtn.textContent = originalText;
        }, 2000);

        this.loadGallery();
      }
    } catch (error) {
      console.error('Save error:', error);
      // Show error state on button
      saveBtn.classList.add('save-error');
      saveBtn.textContent = 'Error!';
      setTimeout(() => {
        saveBtn.classList.remove('save-error');
        saveBtn.textContent = originalText;
      }, 2000);
    }
  }

  // Create sparkle particle effect
  createSparkles(button) {
    const rect = button.getBoundingClientRect();
    const sparkleCount = 12;

    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle-particle';
      sparkle.textContent = ['✨', '⭐', '💫', '✦'][Math.floor(Math.random() * 4)];

      // Position relative to button
      sparkle.style.left = `${rect.left + rect.width / 2}px`;
      sparkle.style.top = `${rect.top + rect.height / 2}px`;

      // Random angle for burst effect
      const angle = (Math.PI * 2 * i) / sparkleCount;
      sparkle.style.setProperty('--tx', `${Math.cos(angle) * 100}px`);
      sparkle.style.setProperty('--ty', `${Math.sin(angle) * 100}px`);

      document.body.appendChild(sparkle);

      // Remove after animation
      setTimeout(() => sparkle.remove(), 1000);
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
    document.getElementById('greeting-section').hidden = true;
    document.getElementById('step-2').hidden = true;
    document.getElementById('step-3').hidden = true;
    document.getElementById('person-autocomplete').value = '';
    document.getElementById('greeting-input').value = '';

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

  openPreviewModal() {
    // Only open modal if there's a preview to show
    if (!this.currentDocumentImage && !this.currentCard) return;

    const canvas = document.getElementById('card-canvas');
    const greeting = document.getElementById('greeting-input').value;

    // Create temporary card object from current preview
    const tempCard = {
      id: this.currentCard?.id || 'preview',
      imagePath: canvas.toDataURL('image/png'),
      personName: this.selectedPersons.map(p => p.name).join(', ') || 'Preview',
      greeting: greeting || 'Merry Christmas!',
      createdAt: new Date().toISOString()
    };

    this.currentModalCard = tempCard;

    // Populate modal
    document.getElementById('modal-image').src = tempCard.imagePath;
    document.getElementById('modal-person').textContent = tempCard.personName;
    document.getElementById('modal-greeting').textContent = tempCard.greeting;
    document.getElementById('modal-date').textContent = `Preview`;

    document.getElementById('card-modal').hidden = false;
  }

  downloadModalCard() {
    if (!this.currentModalCard) return;

    const link = document.createElement('a');
    link.download = `christmas-card-${this.currentModalCard.personName.replace(/\s+/g, '-')}.png`;
    link.href = this.currentModalCard.imagePath;
    link.click();
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new ChristmasCardGenerator();
});
