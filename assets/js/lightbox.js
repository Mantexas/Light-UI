// ============================================
// Lightbox with Keyboard & Touch Navigation
// ============================================

class Lightbox {
  constructor() {
    this.currentIndex = 0;
    this.images = [];
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    this.createLightboxHTML();
    this.bindEvents();
  }

  createLightboxHTML() {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <img class="lightbox-image" src="" alt="">
      </div>
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Previous">&larr;</button>
      <button class="lightbox-nav lightbox-next" aria-label="Next">&rarr;</button>
      <div class="lightbox-counter"></div>
    `;
    document.body.appendChild(lightbox);
    
    this.lightbox = lightbox;
    this.image = lightbox.querySelector('.lightbox-image');
    this.counter = lightbox.querySelector('.lightbox-counter');
  }

  bindEvents() {
    // Gallery item clicks
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery-item');
      if (item) {
        this.open(item);
      }
    });

    // Close button
    this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
      this.close();
    });

    // Navigation buttons
    this.lightbox.querySelector('.lightbox-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      this.prev();
    });

    this.lightbox.querySelector('.lightbox-next').addEventListener('click', (e) => {
      e.stopPropagation();
      this.next();
    });

    // Click outside to close
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) {
        this.close();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.lightbox.classList.contains('active')) return;
      
      switch(e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
      }
    });

    // Touch navigation
    this.lightbox.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.lightbox.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  }

  handleSwipe() {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left
        this.next();
      } else {
        // Swiped right
        this.prev();
      }
    }
  }

  open(item) {
    // Get all gallery items
    this.images = Array.from(document.querySelectorAll('.gallery-item'));
    this.currentIndex = parseInt(item.dataset.index);
    
    // Load image
    const largeSrc = item.dataset.large;
        console.log('Lightbox - largeSrc:', largeSrc);
    this.image.src = largeSrc;
    
    // Update counter
    this.updateCounter();
    
    // Show lightbox
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateImage();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateImage();
  }

  updateImage() {
    const currentItem = this.images[this.currentIndex];
    const largeSrc = currentItem.dataset.large;
    this.image.src = largeSrc;
    this.updateCounter();
  }

  updateCounter() {
    this.counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
  }
}

// Initialize lightbox when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Lightbox());
} else {
  new Lightbox();
}
