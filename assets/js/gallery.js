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

  // Auto-detect images using GitHub API
  async detectImages() {
    try {
      // Get the current repository info from the URL
      const repoOwner = 'Mantexas';
      const repoName = 'Light-UI';
      const branch = 'main';
      
      // Fetch file list from GitHub API
      const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/images/large?ref=${branch}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch image list');
      
      const files = await response.json();
      
      // Filter for image files and create image objects
      const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG'];
      this.images = files
        .filter(file => {
          const ext = file.name.split('.').pop().toLowerCase();
          return imageExtensions.includes(ext);
        })
        .map(file => ({
          thumb: `images/large/${file.name}`,
          large: `images/large/${file.name}`
        }));
      
      console.log(`Found ${this.images.length} images`);
      
    } catch (error) {
      console.error('Error detecting images:', error);
      // Fallback: empty array
      this.images = [];
    }
  }

  // Render gallery grid
  renderGallery() {
    if (this.images.length === 0) {
      // Enhanced empty state
                  this.gridContainer.innerHTML = `
                <div style="text-align: center; padding: var(--space-2xl); grid-column: 1 / -1;">
                    <h2 style="font-size: var(--font-size-xl); margin-bottom: var(--space-md); font-weight: var(--font-weight-normal);">🎨 Gallery is being updated</h2>
                    <p style="color: var(--text-secondary); font-size: var(--font-size-md);">This page is currently being curated with new artwork. Check back soon!</p>
                </div>
            `;// Hide the counter when empty
      const counter = document.querySelector('.image-counter');
      if (counter) counter.style.display = 'none';
      return;
    }

    // Update counter
    const counter = document.querySelector('.image-counter');
    if (counter) {
      counter.textContent = `${this.images.length} ${this.images.length === 1 ? 'image' : 'images'}`;
      counter.style.display = 'block';
    }

    // Render image grid
    this.gridContainer.innerHTML = this.images.map((img, index) => `
      <div class="gallery-item" data-index="${index}">
        <img 
          src="${img.thumb}" 
          data-large="${img.large}"
          alt="Gallery image ${index + 1}"
          loading="lazy"
          class="lazy-image"
        >
      </div>
    `).join('');
  }

  // Setup intersection observer for lazy loading
  setupLazyLoading() {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src || img.src;
          
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
