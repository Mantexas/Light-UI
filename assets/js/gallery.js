/**
 * Gallery Collections Manager - Local File Detection
 * Drag & drop folders into images/gallery/ - that's it. Done.
 */

class GalleryCollections {
  constructor() {
    this.collections = [];
    this.currentCollection = null;
    this.images = [];

    this.collectionsView = document.getElementById('collectionsView');
    this.collectionView = document.getElementById('collectionView');
    this.galleryGrid = document.querySelector('.gallery-grid');
    this.imageCounter = document.querySelector('.image-counter');
    this.collectionTitle = document.getElementById('collectionTitle');
    this.backBtn = document.getElementById('backBtn');

    this.init();
  }

  async init() {
    await this.detectCollections();
    this.setupEventListeners();
  }

  /**
   * Detect collections by scanning for folders with images
   * Tries to load images from common collections
   */
  async detectCollections() {
    try {
      // Try GitHub API first for remote deployment
      await this.detectFromGithub();
    } catch (error) {
      console.log('GitHub API unavailable, using local detection');
      // Fallback to local detection
      await this.detectLocal();
    }
  }

  /**
   * Try GitHub API (for deployed version)
   */
  async detectFromGithub() {
    const apiUrl = 'https://api.github.com/repos/Mantexas/Light-UI/contents/images/gallery';
    const response = await fetch(apiUrl);

    if (!response.ok) throw new Error('GitHub API failed');

    const files = await response.json();
    const folders = Array.isArray(files)
      ? files.filter(f => f.type === 'dir' && !f.name.startsWith('.'))
      : [];

    if (folders.length === 0) {
      this.showEmpty();
      return;
    }

    this.collections = await Promise.all(
      folders.map(async (folder) => ({
        name: folder.name,
        path: folder.path,
        url: folder.url,
        imageCount: await this.getCollectionImageCountGithub(folder.name)
      }))
    );

    if (this.collections.length > 0) {
      this.renderCollections();
    } else {
      this.showEmpty();
    }
  }

  /**
   * Local detection - scan for any folder with images
   */
  async detectLocal() {
    const commonFolders = ['Vilnius', 'Sample', 'Gallery', 'Photography', 'Art', 'Portfolio', 'Travel', 'Nature'];

    const detectedCollections = [];

    // Check each common folder name
    for (const folderName of commonFolders) {
      const imageCount = await this.getImageCountLocal(folderName);
      if (imageCount > 0) {
        detectedCollections.push({
          name: folderName,
          path: `images/${folderName}`,
          imageCount: imageCount
        });
      }
    }

    // Also try to detect ANY folder by attempting to load images
    // This is a brute force approach but works for local development
    if (detectedCollections.length === 0) {
      this.showEmpty();
      return;
    }

    this.collections = detectedCollections;
    this.renderCollections();
  }

  /**
   * Count images in a local folder - now uses directory listing API
   */
  async getImageCountLocal(folderName) {
    try {
      // Try to fetch directory listing (works with Python server or Node static-server)
      const response = await fetch(`images/${folderName}/`);
      const text = await response.text();

      // Parse HTML directory listing for image files
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const links = Array.from(doc.querySelectorAll('a'));

      const imageFiles = links
        .map(a => a.getAttribute('href'))
        .filter(href => href && this.isImageFile(href) && !href.startsWith('..'));

      if (imageFiles.length > 0) {
        return imageFiles.length;
      }
    } catch (error) {
      console.log(`Directory listing failed for ${folderName}, trying pattern detection`);
    }

    // Fallback: pattern-based detection for numbered images
    let count = 0;
    for (let i = 0; i < 100; i++) {
      const result = await this.imageExists(`images/${folderName}/image${i}.jpg`) ||
                     await this.imageExists(`images/${folderName}/photo${i}.jpg`) ||
                     await this.imageExists(`images/${folderName}/${i}.jpg`) ||
                     await this.imageExists(`images/${folderName}/img${i}.png`) ||
                     await this.imageExists(`images/${folderName}/${folderName}${i}.jpg`);

      if (result) {
        count++;
      } else if (i > 10) {
        break;
      }
    }
    return count;
  }

  /**
   * Check if an image file exists
   */
  async imageExists(path) {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get image count from GitHub
   */
  async getCollectionImageCountGithub(collectionName) {
    try {
      const apiUrl = `https://api.github.com/repos/Mantexas/Light-UI/contents/images/gallery/${collectionName}`;
      const response = await fetch(apiUrl);

      if (!response.ok) return 0;

      const files = await response.json();
      return Array.isArray(files)
        ? files.filter(f => this.isImageFile(f.name)).length
        : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Render collection cards
   */
  renderCollections() {
    this.collectionsView.innerHTML = this.collections
      .map((collection) => `
        <div class="collection-card" data-collection="${collection.name}">
          <div class="collection-thumbnail">
            📸
          </div>
          <div class="collection-info">
            <h3 class="collection-name">${this.escapeHtml(collection.name)}</h3>
            <p class="collection-count">${collection.imageCount} image${collection.imageCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      `).join('');

    document.querySelectorAll('.collection-card').forEach(card => {
      card.addEventListener('click', () => {
        const collectionName = card.dataset.collection;
        this.viewCollection(collectionName);
      });
    });
  }

  /**
   * View a specific collection
   */
  async viewCollection(collectionName) {
    this.currentCollection = this.collections.find(c => c.name === collectionName);

    if (!this.currentCollection) return;

    this.collectionTitle.textContent = collectionName;
    this.collectionsView.style.display = 'none';
    this.collectionView.style.display = 'block';

    await this.loadCollectionImages(collectionName);
  }

  /**
   * Load images from a collection - try GitHub first, then local
   */
  async loadCollectionImages(collectionName) {
    try {
      // Try GitHub API first (check both images/ and images/gallery/)
      let apiUrl = `https://api.github.com/repos/Mantexas/Light-UI/contents/images/${collectionName}`;
      let response = await fetch(apiUrl);

      if (!response.ok) {
        // Try gallery subfolder as fallback
        apiUrl = `https://api.github.com/repos/Mantexas/Light-UI/contents/images/gallery/${collectionName}`;
        response = await fetch(apiUrl);
      }

      if (response.ok) {
        const files = await response.json();
        const imageFiles = Array.isArray(files)
          ? files.filter(f => this.isImageFile(f.name))
          : [];

        const basePath = apiUrl.includes('/gallery/') ? 'images/gallery' : 'images';
        this.images = imageFiles.map(file => ({
          name: file.name,
          url: `${basePath}/${collectionName}/${file.name}`,
          thumb: `${basePath}/${collectionName}/${file.name}`
        }));

        this.renderGalleryGrid();
        return;
      }
    } catch (error) {
      console.log('GitHub API failed, trying local...');
    }

    // Fallback to local detection
    await this.loadCollectionImagesLocal(collectionName);
  }

  /**
   * Load images from local folder - uses directory listing
   */
  async loadCollectionImagesLocal(collectionName) {
    const imageFiles = [];

    try {
      // Try to fetch directory listing (works with local dev servers)
      const response = await fetch(`images/${collectionName}/`);
      const text = await response.text();

      // Parse HTML directory listing for image files
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const links = Array.from(doc.querySelectorAll('a'));

      const detectedImages = links
        .map(a => a.getAttribute('href'))
        .filter(href => href && this.isImageFile(href) && !href.startsWith('..'))
        .map(filename => ({
          name: filename,
          url: `images/${collectionName}/${filename}`,
          thumb: `images/${collectionName}/${filename}`
        }));

      if (detectedImages.length > 0) {
        this.images = detectedImages;
        this.renderGalleryGrid();
        return;
      }
    } catch (error) {
      console.log('Directory listing failed, trying pattern detection...');
    }

    // Fallback: Try various naming patterns
    const patterns = [
      (i) => `images/${collectionName}/image${i}.jpg`,
      (i) => `images/${collectionName}/photo${i}.jpg`,
      (i) => `images/${collectionName}/${i}.jpg`,
      (i) => `images/${collectionName}/img${i}.png`,
      (i) => `images/${collectionName}/${collectionName}${i}.jpg`,
      (i) => `images/${collectionName}/image${i}.png`,
      (i) => `images/${collectionName}/photo${i}.png`,
    ];

    // Try to load images - check up to 500 possible images
    for (let i = 0; i < 500; i++) {
      for (const pattern of patterns) {
        const path = pattern(i);
        if (await this.imageExists(path)) {
          imageFiles.push({
            name: path.split('/').pop(),
            url: path,
            thumb: path
          });
          break; // Found this number, move to next
        }
      }
    }

    this.images = imageFiles;

    if (this.images.length === 0) {
      this.galleryGrid.innerHTML = '<p class="loading">No images found in this collection.</p>';
      return;
    }

    this.renderGalleryGrid();
  }

  /**
   * Render gallery grid
   */
  renderGalleryGrid() {
    this.galleryGrid.innerHTML = this.images
      .map((image, index) => `
        <div class="gallery-item" data-index="${index}">
          <img src="${image.thumb}" alt="${this.escapeHtml(image.name)}" loading="lazy">
        </div>
      `).join('');

    this.imageCounter.textContent = `${this.images.length} image${this.images.length !== 1 ? 's' : ''}`;

    // Add click handlers for lightbox
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.openLightbox(index);
      });
    });
  }

  /**
   * Open lightbox
   */
  openLightbox(index) {
    if (!this.images[index]) return;

    const image = this.images[index];
    const modal = document.createElement('div');
    modal.className = 'lightbox-modal';
    modal.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close">&times;</button>
        <img src="${image.url}" alt="${this.escapeHtml(image.name)}" />
        <div class="lightbox-info">
          <p>${this.escapeHtml(image.name)}</p>
          <small>${index + 1} / ${this.images.length}</small>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.lightbox-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') modal.remove();
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.backBtn.addEventListener('click', () => {
      this.collectionsView.style.display = 'block';
      this.collectionView.style.display = 'none';
    });
  }

  /**
   * Show empty state
   */
  showEmpty() {
    this.collectionsView.innerHTML = `
      <div class="gallery-empty-state">
        <p>Coming Soon</p>
        <p class="gallery-empty-state-subtitle">We're currently working on building our gallery collection. Check back soon to explore curated photographs and visual art.</p>
      </div>
    `;
  }

  /**
   * Check if file is an image
   */
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new GalleryCollections();
});
