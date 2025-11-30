/**
 * Gallery Collections Manager
 * Detects collection folders and allows browsing by collection
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
   * Detect collection folders from GitHub API
   */
  async detectCollections() {
    try {
      const apiUrl = 'https://api.github.com/repos/Mantexas/Light-UI/contents/images/gallery';
      const response = await fetch(apiUrl);

      if (!response.ok) {
        if (response.status === 404) {
          this.collectionsView.innerHTML = '<p class="loading">No collections found. Create folders in images/gallery/</p>';
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const files = await response.json();

      // Filter for directories only
      const folders = Array.isArray(files)
        ? files.filter(f => f.type === 'dir' && !f.name.startsWith('.'))
        : [];

      if (folders.length === 0) {
        this.collectionsView.innerHTML = '<p class="loading">No collections found. Create folders in images/gallery/</p>';
        return;
      }

      // Create collection objects
      this.collections = await Promise.all(
        folders.map(async (folder) => {
          return {
            name: folder.name,
            path: folder.path,
            url: folder.url,
            imageCount: await this.getCollectionImageCount(folder.name)
          };
        })
      );

      this.renderCollections();
    } catch (error) {
      console.error('Error detecting collections:', error);
      this.collectionsView.innerHTML = '<p class="loading">Error loading collections. Check console.</p>';
    }
  }

  /**
   * Get image count for a collection
   */
  async getCollectionImageCount(collectionName) {
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
      .map((collection, index) => `
        <div class="collection-card" data-collection="${collection.name}">
          <div class="collection-thumbnail">
            ${collection.imageCount > 0 ? `📸` : '📁'}
          </div>
          <div class="collection-info">
            <h3 class="collection-name">${this.escapeHtml(collection.name)}</h3>
            <p class="collection-count">${collection.imageCount} image${collection.imageCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      `).join('');

    // Add click handlers
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

    // Switch views
    this.collectionsView.style.display = 'none';
    this.collectionView.style.display = 'block';

    // Load images
    await this.loadCollectionImages(collectionName);
  }

  /**
   * Load images from a collection
   */
  async loadCollectionImages(collectionName) {
    try {
      const apiUrl = `https://api.github.com/repos/Mantexas/Light-UI/contents/images/gallery/${collectionName}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        this.galleryGrid.innerHTML = '<p class="loading">Error loading collection images.</p>';
        return;
      }

      const files = await response.json();

      const imageFiles = Array.isArray(files)
        ? files.filter(f => this.isImageFile(f.name))
        : [];

      if (imageFiles.length === 0) {
        this.galleryGrid.innerHTML = '<p class="loading">No images in this collection.</p>';
        this.imageCounter.textContent = '0 images';
        return;
      }

      this.images = imageFiles.map(file => ({
        name: file.name,
        url: `images/gallery/${collectionName}/${file.name}`,
        thumb: `images/gallery/${collectionName}/${file.name}`
      }));

      this.renderGalleryGrid();
      this.updateImageCounter();
      this.setupLightbox();
    } catch (error) {
      console.error('Error loading collection images:', error);
      this.galleryGrid.innerHTML = '<p class="loading">Error loading images.</p>';
    }
  }

  /**
   * Render gallery grid for current collection
   */
  renderGalleryGrid() {
    this.galleryGrid.innerHTML = this.images
      .map((image, index) => `
        <div class="gallery-item" data-index="${index}">
          <img src="${image.url}" alt="${image.name}" loading="lazy">
        </div>
      `).join('');

    // Add click handlers
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const index = parseInt(item.dataset.index);
        this.openLightbox(index);
      });
    });
  }

  /**
   * Update image counter
   */
  updateImageCounter() {
    const count = this.images.length;
    this.imageCounter.textContent = `${count} image${count !== 1 ? 's' : ''}`;
  }

  /**
   * Setup lightbox functionality
   */
  setupLightbox() {
    // Lightbox will be initialized by lightbox.js
    // Update the lightbox with current collection images
    if (window.Lightbox) {
      window.Lightbox.setImages(this.images);
    }
  }

  /**
   * Open lightbox at specific index
   */
  openLightbox(index) {
    if (window.Lightbox) {
      window.Lightbox.open(index);
    }
  }

  /**
   * Back to collections view
   */
  backToCollections() {
    this.currentCollection = null;
    this.collectionsView.style.display = 'block';
    this.collectionView.style.display = 'none';
    this.galleryGrid.innerHTML = '';
  }

  /**
   * Check if file is an image
   */
  isImageFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.backBtn.addEventListener('click', () => this.backToCollections());
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.galleryCollections = new GalleryCollections();
});
