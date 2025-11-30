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
    const commonFolders = ['Vilnius', 'Sample', 'Gallery', 'Photography', 'Art', 'Portfolio'];

    const detectedCollections = [];

    // Check each common folder name
    for (const folderName of commonFolders) {
      const imageCount = await this.getImageCountLocal(folderName);
      if (imageCount > 0) {
        detectedCollections.push({
          name: folderName,
          path: `images/gallery/${folderName}`,
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
   * Count images in a local folder
   */
  async getImageCountLocal(folderName) {
    let count = 0;
    // Try loading up to 100 images with common naming
    for (let i = 0; i < 100; i++) {
      const result = await this.imageExists(`images/gallery/${folderName}/image${i}.jpg`) ||
                     await this.imageExists(`images/gallery/${folderName}/photo${i}.jpg`) ||
                     await this.imageExists(`images/gallery/${folderName}/${i}.jpg`) ||
                     await this.imageExists(`images/gallery/${folderName}/img${i}.png`) ||
                     await this.imageExists(`images/gallery/${folderName}/${folderName}${i}.jpg`);

      if (result) {
        count++;
      } else if (i > 10) {
        // Stop checking after finding gaps
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
      // Try GitHub API first
      const apiUrl = `https://api.github.com/repos/Mantexas/Light-UI/contents/images/gallery/${collectionName}`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const files = await response.json();
        const imageFiles = Array.isArray(files)
          ? files.filter(f => this.isImageFile(f.name))
          : [];

        this.images = imageFiles.map(file => ({
          name: file.name,
          url: `images/gallery/${collectionName}/${file.name}`,
          thumb: `images/gallery/${collectionName}/${file.name}`
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
   * Load images from local folder
   */
  async loadCollectionImagesLocal(collectionName) {
    const imageFiles = [];

    // Try various naming patterns
    const patterns = [
      (i) => `images/gallery/${collectionName}/image${i}.jpg`,
      (i) => `images/gallery/${collectionName}/photo${i}.jpg`,
      (i) => `images/gallery/${collectionName}/${i}.jpg`,
      (i) => `images/gallery/${collectionName}/img${i}.png`,
      (i) => `images/gallery/${collectionName}/${collectionName}${i}.jpg`,
      (i) => `images/gallery/${collectionName}/image${i}.png`,
      (i) => `images/gallery/${collectionName}/photo${i}.png`,
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
      <p class="loading">No collections found.</p>
      <p style="text-align: center; color: var(--text-secondary); font-size: var(--font-size-sm);">
        Create a folder in <code>images/gallery/Vilnius</code> and add images. Refresh to see it here.
      </p>
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
