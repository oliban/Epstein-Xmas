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

    // Professional style PNG assets
    this.professionalAssets = {};
    this.assetsLoaded = false;

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
    // Preload professional style assets in background
    this.loadProfessionalAssets();
  }

  // Preload all style PNG assets
  async loadProfessionalAssets() {
    if (this.assetsLoaded) return;

    const assetUrls = {
      // Professional
      garlandHorizontal: '/assets/professional/garland-horizontal.png',
      garlandHorizontalAlt: '/assets/professional/garland-horizontal-alt.png',
      bellGold: '/assets/professional/bell-gold.png',
      bellMedium: '/assets/professional/bell-medium.png',
      ribbonBanner: '/assets/professional/ribbon-banner.png',
      ribbonBannerAlt: '/assets/professional/ribbon-banner-alt.png',

      // Traditional
      traditional_holly: '/assets/traditional/holly-garland.png',
      traditional_ornament_red: '/assets/traditional/ornament-red.png',
      traditional_ornament_gold: '/assets/traditional/ornament-gold.png',
      traditional_ornament_green: '/assets/traditional/ornament-green.png',

      // Modern
      modern_snowflake: '/assets/modern/snowflake-modern.png',
      modern_star: '/assets/modern/star-geometric.png',

      // Funny
      funny_santa: '/assets/funny/santa-cartoon.png',

      // Elegant
      elegant_frame: '/assets/elegant/ornate-frame.png',

      // Tropical
      tropical_palm_tree: '/assets/tropical/palm-tree.png',
      tropical_palm_tree_2: '/assets/tropical/palm-tree-2.png',
      tropical_palm_tree_4: '/assets/tropical/palm-tree-4.png',
      tropical_hibiscus: '/assets/tropical/hibiscus-flower.png',
      tropical_plumeria: '/assets/tropical/plumeria.png',
      tropical_monstera: '/assets/tropical/monstera-leaf.png',
      tropical_coconut: '/assets/tropical/coconut-ornament.png',
      tropical_shell: '/assets/tropical/shell.png',
      tropical_pineapple: '/assets/tropical/pineapple.png'
    };

    const loadPromises = Object.entries(assetUrls).map(([key, url]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.professionalAssets[key] = img;
          console.log(`Loaded asset: ${key}`);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load asset: ${url}`);
          resolve(); // Don't reject, allow graceful degradation
        };
        img.src = url;
      });
    });

    await Promise.all(loadPromises);
    this.assetsLoaded = true;
    console.log('All style assets loaded successfully');
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
  }

  async loadPageAtIndex(index) {
    const page = this.matchedPages[index];
    if (!page) return;

    // Fetch the image
    const imgResponse = await fetch(page.imageUrl, { cache: 'no-cache' });
    if (!imgResponse.ok) {
      throw new Error(`Failed to load document image (HTTP ${imgResponse.status})`);
    }

    const blob = await imgResponse.blob();
    this.currentDocumentImage = await this.createImageFromBlob(blob);
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

    // Handle Christmas styles (traditional, funny, elegant, tropical, professional)
    const backgrounds = {
      traditional: { gradient: ['#1a472a', '#2d5a3a'], accent: '#c41e3a', overlay: 'rgba(26, 71, 42, 0.35)' },
      funny: { gradient: ['#ff6b6b', '#feca57'], accent: '#ffffff', overlay: 'rgba(255, 107, 107, 0.3)' },
      elegant: { gradient: ['#2c1810', '#4a2c2a'], accent: '#d4af37', overlay: 'rgba(44, 24, 16, 0.35)' },
      tropical: { gradient: ['#00b4d8', '#48cae4'], accent: '#ff9f1c', overlay: 'rgba(0, 180, 216, 0.3)' },
      professional: { gradient: ['#8b0000', '#660000'], accent: '#d4af37', overlay: 'rgba(139, 0, 0, 0.2)', ribbon: '#8b0000', gold: '#ffd700', textColor: '#ffffff' }
    };

    const style = backgrounds[this.selectedStyle] || backgrounds.traditional;

    // Apply overlay for text readability
    if (this.selectedStyle === 'professional') {
      // Create rich sparkly red gradient background for professional style
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(139, 0, 0, 0.3)');
      gradient.addColorStop(0.5, 'rgba(165, 0, 0, 0.35)');
      gradient.addColorStop(1, 'rgba(102, 0, 0, 0.4)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add sparkle/glitter effect (like reference image)
      this.drawSparkles(ctx, 150, ['rgba(255, 215, 0, OPACITY)', 'rgba(255, 255, 255, OPACITY)'], [0.6, 0.4]);
    } else if (this.selectedStyle === 'traditional') {
      // Rich forest green gradient for traditional style
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(26, 71, 42, 0.25)');
      gradient.addColorStop(0.5, 'rgba(45, 90, 58, 0.3)');
      gradient.addColorStop(1, 'rgba(21, 56, 34, 0.35)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add 100 golden and red sparkles
      this.drawSparkles(ctx, 100, ['rgba(255, 215, 0, OPACITY)', 'rgba(196, 30, 58, OPACITY)'], [0.7, 0.3]);
    } else if (this.selectedStyle === 'funny') {
      // Vibrant gradient for funny style
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(255, 107, 107, 0.25)');
      gradient.addColorStop(0.5, 'rgba(254, 202, 87, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 107, 107, 0.25)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add 80 rainbow-colored sparkles
      this.drawSparkles(ctx, 80, [
        'rgba(255, 107, 107, OPACITY)',
        'rgba(254, 202, 87, OPACITY)',
        'rgba(99, 205, 218, OPACITY)',
        'rgba(162, 155, 254, OPACITY)'
      ], [0.25, 0.25, 0.25, 0.25]);
    } else if (this.selectedStyle === 'elegant') {
      // Rich burgundy/brown gradient for elegant style
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(44, 24, 16, 0.25)');
      gradient.addColorStop(0.5, 'rgba(74, 44, 42, 0.3)');
      gradient.addColorStop(1, 'rgba(44, 24, 16, 0.35)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add 100 subtle gold sparkles
      this.drawSparkles(ctx, 100, ['rgba(212, 175, 55, OPACITY)'], [1.0]);
    } else if (this.selectedStyle === 'tropical') {
      // Subtle warm tropical overlay
      ctx.fillStyle = 'rgba(255, 220, 150, 0.15)'; // Very subtle warm golden tint
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add sparkles with tropical colors
      this.drawSparkles(ctx, 100, [
        'rgba(255, 255, 255, OPACITY)',      // White sparkles (60%)
        'rgba(255, 215, 0, OPACITY)',        // Golden sparkles (30%)
        'rgba(0, 255, 200, OPACITY)'         // Bright aqua sparkles (10%)
      ], [0.6, 0.3, 0.1]);
    } else {
      ctx.fillStyle = style.overlay;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw decorative elements
    this.drawDecorations(ctx, this.selectedStyle, style.accent);

    // Draw text - professional style uses different formatting
    if (this.selectedStyle === 'professional') {
      // Header with elegant script font
      ctx.fillStyle = style.gold;
      ctx.font = 'bold 64px "Great Vibes", cursive';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 10;
      ctx.fillText('Merry Christmas!', canvas.width / 2, 100);
      ctx.shadowColor = 'transparent';

      // Person names in white with festive font
      ctx.fillStyle = '#ffffff';
      const names = this.getPersonNames();
      const fontSize = names.length > 40 ? 28 : 36;
      ctx.font = `bold ${fontSize}px "Mountains of Christmas", cursive, serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 6;
      this.wrapText(ctx, `From: ${names}`, canvas.width / 2, 170, canvas.width - 160, fontSize + 6);
      ctx.shadowColor = 'transparent';

      // Greeting text in gold
      ctx.fillStyle = '#d4af37'; // Gold
      ctx.font = '48px "Great Vibes", cursive';

      // Strong shadow for readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      this.wrapText(ctx, greeting, canvas.width / 2, 480, canvas.width - 200, 56);
      ctx.shadowColor = 'transparent';
    } else if (this.selectedStyle === 'traditional') {
      // Traditional style: Red and gold text with festive font
      ctx.textAlign = 'center';

      // Header in red with gold outline
      ctx.font = 'bold 56px "Mountains of Christmas", cursive, serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Gold outline
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.strokeText('Merry Christmas!', canvas.width / 2, 95);

      // Red fill
      ctx.fillStyle = '#c41e3a';
      ctx.fillText('Merry Christmas!', canvas.width / 2, 95);
      ctx.shadowColor = 'transparent';

      // Person names in white
      ctx.fillStyle = '#ffffff';
      const names = this.getPersonNames();
      const fontSize = names.length > 40 ? 28 : 36;
      ctx.font = `bold ${fontSize}px "Mountains of Christmas", cursive, serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 8;
      this.wrapText(ctx, `From: ${names}`, canvas.width / 2, 165, canvas.width - 100, fontSize + 8);
      ctx.shadowColor = 'transparent';

      // Greeting text in gold
      ctx.fillStyle = '#d4af37';
      ctx.font = '26px "Mountains of Christmas", cursive, serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      this.wrapText(ctx, greeting, canvas.width / 2, 480, canvas.width - 120, 34);
      ctx.shadowColor = 'transparent';
    } else if (this.selectedStyle === 'funny') {
      // Funny style: Colorful playful text
      ctx.textAlign = 'center';

      // Header with rainbow effect
      ctx.font = 'bold 54px "Mountains of Christmas", cursive, serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 10;

      // Colorful stroke
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 4;
      ctx.strokeText('Merry Christmas!', canvas.width / 2, 92);

      // Yellow fill
      ctx.fillStyle = '#feca57';
      ctx.fillText('Merry Christmas!', canvas.width / 2, 92);
      ctx.shadowColor = 'transparent';

      // Person names in white with strong shadow
      ctx.fillStyle = '#ffffff';
      const names = this.getPersonNames();
      const fontSize = names.length > 40 ? 28 : 36;
      ctx.font = `bold ${fontSize}px "Mountains of Christmas", cursive, serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 10;
      this.wrapText(ctx, `From: ${names}`, canvas.width / 2, 162, canvas.width - 100, fontSize + 8);
      ctx.shadowColor = 'transparent';

      // Greeting text in vibrant color
      ctx.fillStyle = '#ff6b6b';
      ctx.font = '28px "Mountains of Christmas", cursive, serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 8;
      this.wrapText(ctx, greeting, canvas.width / 2, 480, canvas.width - 120, 36);
      ctx.shadowColor = 'transparent';
    } else if (this.selectedStyle === 'elegant') {
      // Elegant style: Burgundy and gold sophisticated text
      ctx.textAlign = 'center';

      // Header in elegant script
      ctx.font = 'bold 58px "Great Vibes", cursive';
      ctx.fillStyle = '#d4af37'; // Gold
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 12;
      ctx.fillText('Merry Christmas!', canvas.width / 2, 96);
      ctx.shadowColor = 'transparent';

      // Person names in white with gold glow
      ctx.fillStyle = '#ffffff';
      const names = this.getPersonNames();
      const fontSize = names.length > 40 ? 26 : 34;
      ctx.font = `${fontSize}px "Great Vibes", cursive`;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
      ctx.shadowBlur = 10;
      this.wrapText(ctx, `From: ${names}`, canvas.width / 2, 165, canvas.width - 120, fontSize + 8);
      ctx.shadowColor = 'transparent';

      // Greeting text in burgundy
      ctx.fillStyle = '#8b4513'; // Saddle brown
      ctx.font = '32px "Great Vibes", cursive';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 8;
      this.wrapText(ctx, greeting, canvas.width / 2, 480, canvas.width - 140, 40);
      ctx.shadowColor = 'transparent';
    } else if (this.selectedStyle === 'tropical') {
      // Tropical style: Vibrant orange and turquoise text
      ctx.textAlign = 'center';

      // Header in bright orange
      ctx.font = 'bold 56px "Mountains of Christmas", cursive, serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff9f1c'; // Bright orange
      ctx.fillText('Merry Christmas!', canvas.width / 2, 94);
      ctx.shadowColor = 'transparent';

      // Person names in white with warm glow
      ctx.fillStyle = '#ffffff';
      const names = this.getPersonNames();
      const fontSize = names.length > 40 ? 28 : 36;
      ctx.font = `bold ${fontSize}px "Mountains of Christmas", cursive, serif`;
      ctx.shadowColor = 'rgba(255, 159, 28, 0.4)';
      ctx.shadowBlur = 10;
      this.wrapText(ctx, `From: ${names}`, canvas.width / 2, 164, canvas.width - 100, fontSize + 8);
      ctx.shadowColor = 'transparent';

      // Greeting text in golden yellow
      ctx.fillStyle = '#FFD700'; // Golden yellow
      ctx.font = '26px "Mountains of Christmas", cursive, serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      this.wrapText(ctx, greeting, canvas.width / 2, 480, canvas.width - 120, 34);
      ctx.shadowColor = 'transparent';
    } else {
      // Fallback standard text rendering
      ctx.fillStyle = style.accent;
      ctx.font = 'bold 48px "Mountains of Christmas", cursive, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Merry Christmas!', canvas.width / 2, 80);

      ctx.fillStyle = '#ffffff';
      const names = this.getPersonNames();
      const fontSize = names.length > 40 ? 28 : 36;
      ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
      this.wrapText(ctx, `From: ${names}`, canvas.width / 2, 140, canvas.width - 80, fontSize + 8);

      ctx.font = '22px "Inter", sans-serif';
      this.wrapText(ctx, greeting, canvas.width / 2, 480, canvas.width - 100, 30);
    }

    document.getElementById('greeting-input').value = greeting;
  }

  // Draw style-specific decorations
  drawDecorations(ctx, style, accentColor) {
    ctx.fillStyle = accentColor;
    ctx.strokeStyle = accentColor;

    switch (style) {
      case 'traditional':
        // Draw holly garland border
        this.drawTraditionalBorder(ctx);
        // Draw PNG ornaments in corners
        this.drawTraditionalOrnaments(ctx);
        // Draw festive snowflakes (reuse from professional)
        this.drawFestiveSnowflakes(ctx);
        break;
      case 'funny':
        // Draw comic-style border
        this.drawFunnyBorder(ctx);
        // Draw cartoon characters
        this.drawFunnyCharacters(ctx);
        break;
      case 'elegant':
        // Draw ornate frame border
        this.drawElegantBorder(ctx);
        // Draw filigree corners
        this.drawElegantCorners(ctx);
        // Draw crystal ornaments
        this.drawElegantOrnaments(ctx);
        break;
      case 'tropical':
        // Draw palm frond border
        this.drawTropicalBorder(ctx);
        // Draw tropical flowers
        this.drawTropicalFlowers(ctx);
        break;
      case 'professional':
        // Draw garland borders
        this.drawProfessionalBorder(ctx);
        // Draw corner bells
        this.drawProfessionalBells(ctx);
        // Draw festive snowflakes
        this.drawFestiveSnowflakes(ctx);
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

  // Professional style decoration methods
  drawProfessionalBorder(ctx) {
    if (!this.professionalAssets.garlandHorizontal) {
      console.warn('Professional garland asset not loaded');
      return;
    }

    // Randomly choose between garland styles
    const useAltGarland = Math.random() > 0.5;
    const garland = useAltGarland && this.professionalAssets.garlandHorizontalAlt
      ? this.professionalAssets.garlandHorizontalAlt
      : this.professionalAssets.garlandHorizontal;

    const canvas = ctx.canvas;

    // Calculate target height for garland (smaller to keep on outer edges)
    const targetHeight = 80; // Fixed pixel height for garland
    const scale = targetHeight / garland.height;
    const scaledWidth = garland.width * scale;

    // Draw top garland - tiled/repeated across width to maintain aspect ratio
    ctx.save();
    const repetitions = Math.ceil(canvas.width / scaledWidth);
    for (let i = 0; i < repetitions; i++) {
      ctx.drawImage(
        garland,
        0, 0,
        garland.width, garland.height,
        i * scaledWidth, 0,
        scaledWidth, targetHeight
      );
    }
    ctx.restore();

    // Draw bottom garland (flipped vertically) - tiled across width
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    for (let i = 0; i < repetitions; i++) {
      ctx.drawImage(
        garland,
        0, 0,
        garland.width, garland.height,
        i * scaledWidth, 0,
        scaledWidth, targetHeight
      );
    }
    ctx.restore();
  }

  drawGarlandSection(ctx, x1, y1, x2, y2, greenColor, berryColor, ribbonColor) {
    ctx.save();

    const length = x2 - x1;
    const steps = 20;
    const amplitude = 15;

    // Draw multiple layers for fuller, denser garland
    for (let layer = 0; layer < 3; layer++) {
      ctx.strokeStyle = layer === 0 ? '#0d4d1f' : (layer === 1 ? greenColor : '#1f6b33');
      ctx.lineWidth = 35 - layer * 8;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.7 + layer * 0.15;

      ctx.beginPath();
      ctx.moveTo(x1, y1);

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + length * t;
        const y = y1 + Math.sin(t * Math.PI * 4 + layer) * amplitude + Math.cos(t * Math.PI * 7) * 8;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Add MANY holly berries in clusters (like reference image)
    ctx.fillStyle = berryColor;
    const berryCount = 35; // Much more berries
    for (let i = 0; i < berryCount; i++) {
      const t = Math.random();
      const x = x1 + length * t + (Math.random() * 25 - 12);
      const y = y1 + Math.sin(t * Math.PI * 4) * amplitude + (Math.random() * 30 - 15);
      const size = Math.random() * 3 + 4;

      // Add shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Add highlight
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
      ctx.beginPath();
      ctx.arc(x - size/3, y - size/3, size/3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = berryColor;
    }

    // Add golden ornament balls
    for (let i = 0; i < 8; i++) {
      const t = i / 8 + 0.05;
      const x = x1 + length * t;
      const y = y1 + Math.sin(t * Math.PI * 4) * amplitude;

      // Gold ball
      const gradient = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, 8);
      gradient.addColorStop(0, '#ffd700');
      gradient.addColorStop(1, '#b8860b');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add ribbon bows
    ctx.fillStyle = '#c41e3a';
    for (let i = 0; i < 6; i++) {
      const x = x1 + length * (i / 6 + 0.08);
      this.drawSmallBow(ctx, x, y1 + 5, 15);
    }

    ctx.restore();
  }

  drawVerticalGarland(ctx, x, y1, height, greenColor, berryColor) {
    ctx.save();

    const steps = 25;

    // Draw multiple layers for fuller vertical garland
    for (let layer = 0; layer < 3; layer++) {
      ctx.strokeStyle = layer === 0 ? '#0d4d1f' : (layer === 1 ? greenColor : '#1f6b33');
      ctx.lineWidth = 30 - layer * 7;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.7 + layer * 0.15;

      ctx.beginPath();
      ctx.moveTo(x, y1);
      for (let i = 0; i <= steps; i++) {
        const y = y1 + (height * i / steps);
        const xOffset = Math.sin(i * 0.6 + layer) * 10 + Math.cos(i * 0.3) * 5;
        ctx.lineTo(x + xOffset, y);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Add many berries along the vertical
    ctx.fillStyle = berryColor;
    for (let i = 0; i < 20; i++) {
      const y = y1 + (height * Math.random());
      const xOffset = Math.sin((i / 20) * Math.PI * 5) * 10;
      const size = Math.random() * 3 + 3;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(x + xOffset + (Math.random() * 12 - 6), y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowColor = 'transparent';

    ctx.restore();
  }

  drawSmallBow(ctx, x, y, size) {
    // Simple bow shape (two loops)
    ctx.beginPath();
    ctx.arc(x - size/2, y, size/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size/2, y, size/2, 0, Math.PI * 2);
    ctx.fill();

    // Center knot
    ctx.beginPath();
    ctx.arc(x, y, size/3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawProfessionalBells(ctx) {
    if (!this.professionalAssets.bellGold) {
      console.warn('Professional bell asset not loaded');
      return;
    }

    // 80% chance to show bells at all
    if (Math.random() > 0.8) {
      return;
    }

    ctx.save();

    // Randomly choose between bell styles
    const useAltBell = Math.random() > 0.5;
    const bell = useAltBell && this.professionalAssets.bellMedium
      ? this.professionalAssets.bellMedium
      : this.professionalAssets.bellGold;

    // Random bell size variation (60-90 pixels) - smaller to stay on edges
    const bellSize = 60 + Math.random() * 30;

    // Calculate scaling
    const scale = bellSize / bell.height;
    const bellWidth = bell.width * scale;

    // Position bells very close to corners with minimal random variation
    const leftX = 30 + Math.random() * 15;
    const leftY = 10 + Math.random() * 15;

    // Position right bell very close to corner
    const canvas = ctx.canvas;
    const rightX = canvas.width - 30 - Math.random() * 15;
    const rightY = 10 + Math.random() * 15;

    // Draw bell in top-left corner
    ctx.drawImage(
      bell,
      leftX - bellWidth/2, leftY,
      bellWidth, bellSize
    );

    // Draw bell in top-right corner
    ctx.drawImage(
      bell,
      rightX - bellWidth/2, rightY,
      bellWidth, bellSize
    );

    // Optional: Add glow effect with random intensity
    const glowIntensity = 0.1 + Math.random() * 0.2;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20 + Math.random() * 10;
    ctx.globalAlpha = glowIntensity;
    // Redraw for glow
    ctx.drawImage(bell, leftX - bellWidth/2, leftY, bellWidth, bellSize);
    ctx.drawImage(bell, rightX - bellWidth/2, rightY, bellWidth, bellSize);
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawBell(ctx, x, y, size) {
    ctx.save();

    // Create metallic gold gradient for bell
    const bellGradient = ctx.createRadialGradient(x - size/3, y + size/2, size/4, x, y + size/2, size);
    bellGradient.addColorStop(0, '#ffd700');
    bellGradient.addColorStop(0.5, '#daa520');
    bellGradient.addColorStop(1, '#b8860b');

    // Bell shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;

    // Bell body (more realistic curved shape)
    ctx.fillStyle = bellGradient;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - size/2, y + size/4, x - size/2.5, y + size/1.5);
    ctx.quadraticCurveTo(x - size/3, y + size, x, y + size);
    ctx.quadraticCurveTo(x + size/3, y + size, x + size/2.5, y + size/1.5);
    ctx.quadraticCurveTo(x + size/2, y + size/4, x, y);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Bell rim (bottom edge)
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - size/3, y + size);
    ctx.lineTo(x + size/3, y + size);
    ctx.stroke();

    // Bell top (crown)
    const crownGradient = ctx.createLinearGradient(x, y - size/3, x, y);
    crownGradient.addColorStop(0, '#ffd700');
    crownGradient.addColorStop(1, '#daa520');
    ctx.fillStyle = crownGradient;
    ctx.fillRect(x - size/5, y - size/3, size/2.5, size/3);

    // Hanging loop
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y - size/2.5, size/8, 0, Math.PI, true);
    ctx.stroke();

    // Bell clapper
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(x, y + size/3);
    ctx.lineTo(x - size/10, y + size * 0.8);
    ctx.lineTo(x + size/10, y + size * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y + size * 0.85, size/7, 0, Math.PI * 2);
    ctx.fill();

    // Bright highlight for shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(x - size/4, y + size/3, size/6, size/4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 25;
    ctx.globalAlpha = 0.3;
    ctx.fill();

    ctx.restore();
  }

  drawFestiveSnowflakes(ctx) {
    ctx.save();

    // Draw MANY realistic snowflakes (like reference image)
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      const size = Math.random() * 12 + 4;
      const opacity = Math.random() * 0.7 + 0.3;
      const rotation = Math.random() * Math.PI * 2;

      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Draw detailed 6-armed snowflake
      for (let arm = 0; arm < 6; arm++) {
        ctx.save();
        ctx.rotate((arm * Math.PI) / 3);

        // Main arm
        ctx.fillRect(-1, 0, 2, size);

        // Side branches
        ctx.save();
        ctx.translate(0, size * 0.3);
        ctx.rotate(Math.PI / 6);
        ctx.fillRect(-0.8, 0, 1.6, size * 0.4);
        ctx.restore();

        ctx.save();
        ctx.translate(0, size * 0.3);
        ctx.rotate(-Math.PI / 6);
        ctx.fillRect(-0.8, 0, 1.6, size * 0.4);
        ctx.restore();

        ctx.save();
        ctx.translate(0, size * 0.7);
        ctx.rotate(Math.PI / 6);
        ctx.fillRect(-0.8, 0, 1.6, size * 0.3);
        ctx.restore();

        ctx.save();
        ctx.translate(0, size * 0.7);
        ctx.rotate(-Math.PI / 6);
        ctx.fillRect(-0.8, 0, 1.6, size * 0.3);
        ctx.restore();

        ctx.restore();
      }

      // Center hexagon
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (j * Math.PI) / 3;
        const r = size / 4;
        if (j === 0) {
          ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        } else {
          ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  drawRibbonBanner(ctx, x, y, width) {
    if (!this.professionalAssets.ribbonBanner) {
      console.warn('Ribbon banner asset not loaded');
      return;
    }

    ctx.save();

    // Randomly choose between ribbon banner styles
    const useAltBanner = Math.random() > 0.5;
    const banner = useAltBanner && this.professionalAssets.ribbonBannerAlt
      ? this.professionalAssets.ribbonBannerAlt
      : this.professionalAssets.ribbonBanner;

    // Target height for banner
    const targetHeight = 120;

    // Calculate proportional width to maintain aspect ratio
    const scale = targetHeight / banner.height;
    const scaledWidth = banner.width * scale;

    // Draw banner centered at x, y
    ctx.drawImage(
      banner,
      0, 0,
      banner.width, banner.height,
      x - scaledWidth/2, y - targetHeight/2,
      scaledWidth, targetHeight
    );

    ctx.restore();
  }

  // Traditional style decoration methods
  drawTraditionalBorder(ctx) {
    if (!this.professionalAssets.traditional_holly) {
      console.warn('Traditional holly asset not loaded');
      return;
    }

    const canvas = ctx.canvas;
    const holly = this.professionalAssets.traditional_holly;

    // Calculate target height for holly garland
    const targetHeight = 100;
    const scale = targetHeight / holly.height;
    const scaledWidth = holly.width * scale;

    ctx.save();

    // Draw top holly garland - tiled across width
    const repetitions = Math.ceil(canvas.width / scaledWidth);
    for (let i = 0; i < repetitions; i++) {
      ctx.drawImage(
        holly,
        0, 0,
        holly.width, holly.height,
        i * scaledWidth, 0,
        scaledWidth, targetHeight
      );
    }

    // Draw bottom holly garland (flipped vertically)
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    for (let i = 0; i < repetitions; i++) {
      ctx.drawImage(
        holly,
        0, 0,
        holly.width, holly.height,
        i * scaledWidth, 0,
        scaledWidth, targetHeight
      );
    }
    ctx.restore();

    ctx.restore();
  }

  drawTraditionalOrnaments(ctx) {
    const ornamentAssets = [
      this.professionalAssets.traditional_ornament_red,
      this.professionalAssets.traditional_ornament_gold,
      this.professionalAssets.traditional_ornament_green
    ].filter(asset => asset); // Only use loaded assets

    if (ornamentAssets.length === 0) {
      console.warn('No traditional ornament assets loaded');
      return;
    }

    ctx.save();

    const canvas = ctx.canvas;
    const ornamentSize = 80 + Math.random() * 40; // 80-120px

    // Place ornaments in corners with random selection
    const positions = [
      { x: 60, y: 120 }, // Top-left
      { x: canvas.width - 60, y: 120 }, // Top-right
      { x: 60, y: canvas.height - 120 }, // Bottom-left
      { x: canvas.width - 60, y: canvas.height - 120 } // Bottom-right
    ];

    positions.forEach(pos => {
      // Randomly select ornament
      const ornament = ornamentAssets[Math.floor(Math.random() * ornamentAssets.length)];
      const scale = ornamentSize / ornament.height;
      const scaledWidth = ornament.width * scale;

      // Random positioning variation
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;

      // Add subtle glow
      ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
      ctx.shadowBlur = 15;

      ctx.drawImage(
        ornament,
        pos.x + offsetX - scaledWidth / 2,
        pos.y + offsetY - ornamentSize / 2,
        scaledWidth,
        ornamentSize
      );
    });

    ctx.shadowColor = 'transparent';
    ctx.restore();
  }

  // Modern style decoration methods
  drawModernBorder(ctx) {
    if (!this.professionalAssets.modern_star) {
      console.warn('Modern star asset not loaded');
      return;
    }

    const canvas = ctx.canvas;
    const star = this.professionalAssets.modern_star;

    ctx.save();

    // Draw minimalist border with geometric stars
    const starSize = 40 + Math.random() * 20;
    const scale = starSize / star.height;
    const scaledWidth = star.width * scale;

    // Top corners
    const topPositions = [
      { x: 50, y: 50 },
      { x: canvas.width - 50, y: 50 }
    ];

    topPositions.forEach(pos => {
      ctx.globalAlpha = 0.6 + Math.random() * 0.3;
      ctx.drawImage(
        star,
        pos.x - scaledWidth / 2,
        pos.y - starSize / 2,
        scaledWidth,
        starSize
      );
    });

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawModernBokeh(ctx) {
    ctx.save();

    const canvas = ctx.canvas;

    // Draw 120 bokeh light effects (soft circular gradients)
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 40 + 15;
      const opacity = Math.random() * 0.2 + 0.1;

      // Color variations: white, cyan, silver
      const colors = [
        `rgba(255, 255, 255, ${opacity})`,
        `rgba(100, 200, 255, ${opacity})`,
        `rgba(192, 192, 192, ${opacity})`
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawModernOrnaments(ctx) {
    if (!this.professionalAssets.modern_snowflake) {
      return;
    }

    const canvas = ctx.canvas;
    const snowflake = this.professionalAssets.modern_snowflake;

    ctx.save();

    // Scatter a few geometric snowflakes
    for (let i = 0; i < 6; i++) {
      const size = 50 + Math.random() * 30;
      const scale = size / snowflake.height;
      const scaledWidth = snowflake.width * scale;

      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const rotation = Math.random() * Math.PI * 2;
      const opacity = 0.3 + Math.random() * 0.3;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.drawImage(
        snowflake,
        -scaledWidth / 2,
        -size / 2,
        scaledWidth,
        size
      );
      ctx.restore();
    }

    ctx.restore();
  }

  // Funny style decoration methods
  drawFunnyCharacters(ctx) {
    if (!this.professionalAssets.funny_santa) {
      console.warn('Funny santa asset not loaded');
      return;
    }

    const canvas = ctx.canvas;
    const santa = this.professionalAssets.funny_santa;

    ctx.save();

    // Place cartoon characters at random tilted angles
    const positions = [
      { x: 100, y: 300, rotation: -0.2 },
      { x: 700, y: 300, rotation: 0.2 },
      { x: 400, y: 450, rotation: -0.1 }
    ];

    positions.forEach(pos => {
      const size = 120 + Math.random() * 40;
      const scale = size / santa.height;
      const scaledWidth = santa.width * scale;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(pos.rotation + (Math.random() - 0.5) * 0.2);
      ctx.drawImage(
        santa,
        -scaledWidth / 2,
        -size / 2,
        scaledWidth,
        size
      );
      ctx.restore();
    });

    ctx.restore();
  }

  drawFunnyBorder(ctx) {
    ctx.save();

    const canvas = ctx.canvas;

    // Comic-style zigzag border
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    const zigzagSize = 20;
    const points = Math.floor(canvas.width / zigzagSize);

    // Top border
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const x = i * zigzagSize;
      const y = i % 2 === 0 ? 15 : 30;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Bottom border
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const x = i * zigzagSize;
      const y = canvas.height - (i % 2 === 0 ? 15 : 30);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Add comic-style "twinkle" stars
    ctx.fillStyle = '#feca57';
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 15 + 10;

      this.drawComicStar(ctx, x, y, size);
    }

    ctx.restore();
  }

  drawComicStar(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? size : size / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Add outline
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  // Elegant style decoration methods
  drawElegantBorder(ctx) {
    if (!this.professionalAssets.elegant_frame) {
      console.warn('Elegant frame asset not loaded');
      return;
    }

    const canvas = ctx.canvas;
    const frame = this.professionalAssets.elegant_frame;

    ctx.save();

    // Draw ornate frame in corners
    const frameSize = 150;
    const scale = frameSize / Math.max(frame.width, frame.height);
    const scaledWidth = frame.width * scale;
    const scaledHeight = frame.height * scale;

    // Top-left corner
    ctx.drawImage(frame, 10, 10, scaledWidth, scaledHeight);

    // Top-right corner (flipped horizontally)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, 10, 10, scaledWidth, scaledHeight);
    ctx.restore();

    // Bottom-left corner (flipped vertically)
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    ctx.drawImage(frame, 10, 10, scaledWidth, scaledHeight);
    ctx.restore();

    // Bottom-right corner (flipped both ways)
    ctx.save();
    ctx.translate(canvas.width, canvas.height);
    ctx.scale(-1, -1);
    ctx.drawImage(frame, 10, 10, scaledWidth, scaledHeight);
    ctx.restore();

    ctx.restore();
  }

  drawElegantCorners(ctx) {
    ctx.save();

    const canvas = ctx.canvas;

    // Draw elegant filigree patterns using curves
    ctx.strokeStyle = '#d4af37'; // Gold
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const drawFiligree = (x, y, flipX = 1, flipY = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flipX, flipY);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(40, 10, 60, 40);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(10, 40, 40, 60);
      ctx.stroke();

      ctx.restore();
    };

    // Draw in all four corners
    drawFiligree(180, 180, 1, 1);
    drawFiligree(canvas.width - 180, 180, -1, 1);
    drawFiligree(180, canvas.height - 180, 1, -1);
    drawFiligree(canvas.width - 180, canvas.height - 180, -1, -1);

    ctx.restore();
  }

  drawElegantOrnaments(ctx) {
    ctx.save();

    const canvas = ctx.canvas;

    // Draw crystal-like ornaments with elegant gradients
    const positions = [
      { x: canvas.width / 2, y: 100 },
      { x: 150, y: canvas.height / 2 },
      { x: canvas.width - 150, y: canvas.height / 2 }
    ];

    positions.forEach(pos => {
      const size = 25 + Math.random() * 10;

      // Crystal gradient (burgundy to gold)
      const gradient = ctx.createRadialGradient(
        pos.x - size / 3, pos.y - size / 3, size / 4,
        pos.x, pos.y, size
      );
      gradient.addColorStop(0, '#d4af37'); // Gold
      gradient.addColorStop(0.5, '#8b4513'); // Saddle brown
      gradient.addColorStop(1, '#4a2511'); // Dark brown

      ctx.fillStyle = gradient;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Add highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(pos.x - size / 3, pos.y - size / 3, size / 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowColor = 'transparent';
    ctx.restore();
  }

  // Helper method to draw sparkles with configurable colors
  drawSparkles(ctx, count, colorTemplates, probabilities) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * ctx.canvas.width;
      const y = Math.random() * ctx.canvas.height;
      const size = Math.random() * 2.5 + 0.5;
      const opacity = Math.random() * 0.6 + 0.2;

      // Select color based on probabilities
      let colorIndex = 0;
      const rand = Math.random();
      let cumulative = 0;
      for (let j = 0; j < probabilities.length; j++) {
        cumulative += probabilities[j];
        if (rand <= cumulative) {
          colorIndex = j;
          break;
        }
      }

      // Replace OPACITY placeholder with actual opacity
      const color = colorTemplates[colorIndex].replace('OPACITY', opacity.toString());
      ctx.fillStyle = color;

      // Star-like sparkle
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size/3, -size/3);
      ctx.lineTo(size, 0);
      ctx.lineTo(size/3, size/3);
      ctx.lineTo(0, size);
      ctx.lineTo(-size/3, size/3);
      ctx.lineTo(-size, 0);
      ctx.lineTo(-size/3, -size/3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Tropical style decoration methods
  drawTropicalBorder(ctx) {
    const canvas = ctx.canvas;
    ctx.save();

    // Collect all available palm trees and tropical foliage
    const palmTrees = [
      this.professionalAssets.tropical_palm_tree,
      this.professionalAssets.tropical_palm_tree_2,
      this.professionalAssets.tropical_palm_tree_4
    ].filter(tree => tree);

    console.log('Tropical palm trees loaded:', palmTrees.length);

    const foliage = [
      this.professionalAssets.tropical_monstera
    ].filter(f => f);

    // Define positions for palm trees and foliage (mix them up)
    const palmPositions = [
      { x: 0, y: canvas.height - 220, type: 'palm', flip: false, size: 220 },
      { x: canvas.width - 120, y: canvas.height - 210, type: 'palm', flip: true, size: 210 },
      { x: 120, y: canvas.height - 180, type: 'palm', flip: false, size: 180 },
      { x: canvas.width - 250, y: canvas.height - 190, type: 'palm', flip: false, size: 190 }
    ];

    const foliagePositions = [
      { x: 80, y: 100, rotation: 0.3, flip: false },
      { x: canvas.width - 80, y: 100, rotation: -0.3, flip: true },
      { x: canvas.width / 2 - 100, y: 120, rotation: 0.2, flip: false },
      { x: canvas.width / 2 + 100, y: 110, rotation: -0.2, flip: true }
    ];

    // Draw palm trees
    if (palmTrees.length > 0) {
      palmPositions.forEach(pos => {
        // Randomly select a palm tree
        const palm = palmTrees[Math.floor(Math.random() * palmTrees.length)];
        const palmSize = pos.size + Math.random() * 30;
        const scale = palmSize / palm.height;
        const scaledWidth = palm.width * scale;

        ctx.save();
        ctx.globalAlpha = 0.8 + Math.random() * 0.15;

        if (pos.flip) {
          ctx.translate(pos.x, pos.y);
          ctx.scale(-1, 1);
          ctx.drawImage(palm, -scaledWidth, 0, scaledWidth, palmSize);
        } else {
          ctx.drawImage(palm, pos.x, pos.y, scaledWidth, palmSize);
        }

        ctx.restore();
      });
    }

    // Add monstera leaves for tropical layering
    if (foliage.length > 0) {
      foliagePositions.forEach(pos => {
        const leaf = foliage[Math.floor(Math.random() * foliage.length)];
        const size = 70 + Math.random() * 30;
        const scale = size / leaf.height;
        const scaledWidth = leaf.width * scale;

        ctx.save();
        ctx.globalAlpha = 0.65 + Math.random() * 0.2;
        ctx.translate(pos.x, pos.y);
        if (pos.flip) ctx.scale(-1, 1);
        ctx.rotate(pos.rotation + (Math.random() - 0.5) * 0.2);
        ctx.drawImage(
          leaf,
          -scaledWidth / 2,
          -size / 2,
          scaledWidth,
          size
        );
        ctx.restore();
      });
    }

    ctx.restore();
  }

  drawTropicalFlowers(ctx) {
    const canvas = ctx.canvas;
    ctx.save();

    // Collect all available tropical decorations
    const flowers = [
      this.professionalAssets.tropical_hibiscus,
      this.professionalAssets.tropical_plumeria
    ].filter(f => f);

    const ornaments = [
      this.professionalAssets.tropical_coconut,
      this.professionalAssets.tropical_shell,
      this.professionalAssets.tropical_pineapple
    ].filter(o => o);

    // Create decorations with randomized positions
    const decorationCount = 7 + Math.floor(Math.random() * 3); // 7-9 decorations (reduced from 8-11)

    for (let i = 0; i < decorationCount; i++) {
      // Randomly choose flower or ornament (75% flowers, 25% ornaments)
      const isFlower = Math.random() > 0.25;
      let decoration;
      let size;
      let glowColor;
      let opacity;

      if (isFlower && flowers.length > 0) {
        // Use random flower
        decoration = flowers[Math.floor(Math.random() * flowers.length)];
        size = 45 + Math.random() * 30;
        glowColor = 'rgba(255, 102, 102, 0.4)';
        opacity = 0.75 + Math.random() * 0.25; // 75-100% opacity for flowers
      } else if (ornaments.length > 0) {
        // Use random ornament (coconuts, shells, pineapples)
        decoration = ornaments[Math.floor(Math.random() * ornaments.length)];
        size = 50 + Math.random() * 25; // Slightly smaller (was 55-90)
        glowColor = 'rgba(255, 200, 100, 0.2)'; // Less glow
        opacity = 0.4 + Math.random() * 0.2; // 40-60% opacity for ornaments (more transparent)
      }

      if (!decoration) continue;

      // Random position with safe margins
      const margin = 120;
      const x = margin + Math.random() * (canvas.width - margin * 2);
      const y = 80 + Math.random() * (canvas.height - 200); // Avoid very top and bottom

      const scale = size / decoration.height;
      const scaledWidth = decoration.width * scale;
      const rotation = (Math.random() - 0.5) * 0.8; // Random rotation

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Add tropical glow
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12 + Math.random() * 8;

      ctx.drawImage(
        decoration,
        -scaledWidth / 2,
        -size / 2,
        scaledWidth,
        size
      );
      ctx.restore();
    }

    ctx.shadowColor = 'transparent';
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
