// ============================================
// Gallery Auto-Detection & Lazy Loading
// ============================================

class Gallery {
  constructor() {
    this.images = [];
    this.gridContainer = document.querySelector('.gallery-grid');
    this.init();
  }

  async init() {
    await this.detectImages();
    this.renderGallery();
    this.setupLazyLoading();
  }

  // Auto-detect images in /images/large/ folder
  async detectImages() {
    try {
      // Get list of images from the large folder
      // Since we can't directly read directory in browser,
      // we'll use a common naming pattern or manifest
      // For now, let's assume images are named sequentially or use a manifest
      
      // This is a placeholder - in production, you'd either:
      // 1. Generate a manifest file during Lightroom export
      // 2. Use a simple server-side script to list files
      // 3. Manually maintain an array of filenames
      
      // Example: Automatically detect images 1-20
      const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      
      // Simple approach: Try to load images and see which exist
      // This will generate 404s for missing images, but works without backend
      const potentialImages = [];
      
      for (let i = 1; i <= 100; i++) {
        for (const ext of imageExtensions) {
          potentialImages.push({
            thumb: `images/thumbnails/image-${i}.${ext}`,
            large: `images/large/image-${i}.${ext}`
          });
        }
      }
      
      // Test which images actually exist
      const existingImages = await this.checkImages(potentialImages);
      this.images = existingImages;
      
    } catch (error) {
      console.error('Error detecting images:', error);
    }
  }

  // Check if images exist
  async checkImages(imageList) {
    const existing = [];
    
    // Check first 20 only to avoid too many requests
    const checkPromises = imageList.slice(0, 20).map(img => 
      this.imageExists(img.thumb).then(exists => {
        if (exists) existing.push(img);
      })
    );
    
    await Promise.all(checkPromises);
    return existing;
  }

  // Check if single image exists
  imageExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  // Render gallery grid
  renderGallery() {
    if (this.i    if (this.images.length === 0) {
      this.gridContainer.innerHTML = `
        <div style="text-align: center; padding: var(--space-2xl) var(--space-md);">
          <div style="font-size: 64px; margin-bottom: var(--space-md); opacity: 0.3;">📸</div>
          <h2 style="font-size: var(--font-size-lg); font-weight: 500; margin-bottom: var(--space-sm); color: var(--text-primary);">No images yet</h2>
          <p style="color: var(--text-secondary); font-size: var(--font-size-base); max-width: 400px; margin: 0 auto var(--space-lg);">
            Add your photos to get started. Export from Lightroom to <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 3px; font-size: 0.9em;">/images/large/</code> and <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 3px; font-size: 0.9em;">/images/thumbnails/</code>
          </p>
        </div>
      `;
      
      // Hide the counter when empty
      const counter = document.querySelector('.image-counter');
      if (counter) counter.style.display = 'none';
      return;
    }
    this.images.forEach((img, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item loading';
      item.dataset.index = index;
      item.dataset.large = img.large;
      
      const imgEl = document.createElement('img');
      imgEl.dataset.src = img.thumb; // Lazy load
      imgEl.alt = `Image ${index + 1}`;
      
      item.appendChild(imgEl);
      this.gridContainer.appendChild(item);
    });

    // Update counter
    const counter = document.querySelector('.image-counter');
    if (counter) {
      counter.textContent = `${this.images.length} images`;
    }
  }

  // Setup Intersection Observer for lazy loading
  setupLazyLoading() {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.onload = () => {
              img.parentElement.classList.remove('loading');
            };
            delete img.dataset.src;
          }
          
          observer.unobserve(img);
        }
      });
    }, options);

    // Observe all images
    document.querySelectorAll('.gallery-item img').forEach(img => {
      observer.observe(img);
    });
  }
}

// Initialize gallery when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Gallery());
} else {
  new Gallery();
}
