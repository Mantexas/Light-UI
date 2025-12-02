// ============================================
// Advanced Lightbox - Full Featured
// Zoom, Pan, Film Strip, Download, Fullscreen
// ============================================

class AdvancedLightbox {
  constructor() {
    this.images = [];
    this.currentIndex = 0;
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.dragging = false;
    this.startX = 0;
    this.startY = 0;
    this.touchStart = { x: 0, y: 0 };
    this.touchEnd = { x: 0, y: 0 };
    this.preloadNext = null;
    this.preloadPrev = null;

    this.createLightbox();
    this.bindEvents();
  }

  createLightbox() {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.id = 'advancedLightbox';
    lb.innerHTML = `
      <div class="lightbox-click-left"></div>
      <div class="lightbox-click-right"></div>

      <div class="lightbox-counter">1 of 1</div>

      <img class="lightbox-image" draggable="false" alt="" />

      <div class="lightbox-zoom-controls">
        <button class="lightbox-zoom-btn" id="zoomIn" title="Zoom In">
          <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
        <button class="lightbox-zoom-btn" id="zoomOut" title="Zoom Out">
          <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
        </button>
        <button class="lightbox-zoom-btn" id="zoomReset" title="Reset Zoom">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
        </button>
      </div>

      <div class="lightbox-keyboard-hints">
        <div>← → Arrow keys to navigate</div>
        <div>ESC to close</div>
        <div>Mouse wheel to zoom</div>
        <div>+/- to zoom</div>
        <div>S to download</div>
      </div>

      <div class="lightbox-nav-bar">
        <svg id="lb-prevBtn" viewBox="0 0 24 24"><path d="M15.41 7.4L14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>
        <svg id="lb-downloadBtn" viewBox="0 0 24 24" title="Download"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        <svg id="lb-fullscreenBtn" viewBox="0 0 24 24" title="Fullscreen"><path d="M5 5h5V3H3v7h2zm5 14H5v-5H3v7h7zm11-5h-2v5h-5v2h7zm-2-9V3h-5v2h5z"/></svg>
        <svg id="lb-nextBtn" viewBox="0 0 24 24"><path d="M8.6 16.6L13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>
        <svg id="lb-closeBtn" viewBox="0 0 24 24"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>
      </div>

      <div class="lightbox-film-strip">
        <div class="lightbox-thumbnails" id="lb-thumbnails"></div>
      </div>
    `;

    document.body.appendChild(lb);

    this.lb = lb;
    this.lbimg = lb.querySelector('.lightbox-image');
    this.counter = lb.querySelector('.lightbox-counter');
    this.thumbnails = lb.querySelector('#lb-thumbnails');
    this.keyboardHints = lb.querySelector('.lightbox-keyboard-hints');
  }

  bindEvents() {
    // Click zones for navigation
    this.lb.querySelector('.lightbox-click-left').addEventListener('click', () => this.prev());
    this.lb.querySelector('.lightbox-click-right').addEventListener('click', () => this.next());

    // Nav buttons
    this.lb.querySelector('#lb-prevBtn').addEventListener('click', () => this.prev());
    this.lb.querySelector('#lb-nextBtn').addEventListener('click', () => this.next());
    this.lb.querySelector('#lb-closeBtn').addEventListener('click', () => this.close());
    this.lb.querySelector('#lb-downloadBtn').addEventListener('click', () => this.download());
    this.lb.querySelector('#lb-fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());

    // Zoom controls
    this.lb.querySelector('#zoomIn').addEventListener('click', () => {
      this.scale = Math.min(5, this.scale * 1.2);
      this.updateTransform();
    });

    this.lb.querySelector('#zoomOut').addEventListener('click', () => {
      this.scale = Math.max(0.5, this.scale * 0.8);
      this.updateTransform();
    });

    this.lb.querySelector('#zoomReset').addEventListener('click', () => {
      this.scale = 1;
      this.panX = 0;
      this.panY = 0;
      this.updateTransform();
    });

    // Mouse wheel zoom
    this.lbimg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale = Math.max(0.5, Math.min(5, this.scale * delta));
      this.updateTransform();
    }, { passive: false });

    // Pan functionality
    this.lb.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      this.dragging = true;
      this.lbimg.classList.add('drag');
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.updateTransform();
    });

    window.addEventListener('mouseup', () => {
      this.dragging = false;
      this.lbimg.classList.remove('drag');
    });

    // Touch gestures
    this.lb.addEventListener('touchstart', (e) => {
      this.touchStart.x = e.touches[0].clientX;
      this.touchStart.y = e.touches[0].clientY;
    }, { passive: true });

    this.lb.addEventListener('touchend', (e) => {
      this.touchEnd.x = e.changedTouches[0].clientX;
      this.touchEnd.y = e.changedTouches[0].clientY;

      const deltaX = this.touchStart.x - this.touchEnd.x;
      const deltaY = Math.abs(this.touchStart.y - this.touchEnd.y);

      if (Math.abs(deltaX) > 50 && deltaY < 100) {
        if (deltaX > 0) this.next();
        else this.prev();
      }
    }, { passive: true });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!this.lb.classList.contains('show')) return;

      switch(e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.prev();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.next();
          break;
        case '+':
        case '=':
          this.scale = Math.min(5, this.scale * 1.2);
          this.updateTransform();
          break;
        case '-':
          this.scale = Math.max(0.5, this.scale * 0.8);
          this.updateTransform();
          break;
        case '0':
          this.scale = 1;
          this.panX = 0;
          this.panY = 0;
          this.updateTransform();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          this.download();
          break;
      }
    });

    // Fullscreen handling
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && this.lb.classList.contains('show')) {
        // Optional: could auto-close on fullscreen exit
      }
    });

    // Prevent context menu
    this.lbimg.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  open(imageSrc, allImages = []) {
    this.images = allImages.length > 0 ? allImages : [imageSrc];
    this.currentIndex = this.images.findIndex(img => img === imageSrc);
    if (this.currentIndex === -1) this.currentIndex = 0;

    this.scale = 1;
    this.panX = 0;
    this.panY = 0;

    this.lbimg.src = this.images[this.currentIndex];
    this.lb.classList.add('show');
    this.updateCounter();
    this.createThumbnails();
    this.preloadImages();

    // Show keyboard hints on desktop
    if (window.innerWidth > 768) {
      this.keyboardHints.classList.add('show');
      setTimeout(() => this.keyboardHints.classList.remove('show'), 3000);
    }

    document.body.style.overflow = 'hidden';
  }

  close() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    this.lb.classList.remove('show');
    document.body.style.overflow = '';
  }

  next() {
    this.lbimg.classList.add('changing');
    setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      this.lbimg.src = this.images[this.currentIndex];
      this.updateCounter();
      this.updateThumbnails();
      this.preloadImages();
      this.lbimg.classList.remove('changing');
      this.resetZoomPan();
    }, 150);
  }

  prev() {
    this.lbimg.classList.add('changing');
    setTimeout(() => {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
      this.lbimg.src = this.images[this.currentIndex];
      this.updateCounter();
      this.updateThumbnails();
      this.preloadImages();
      this.lbimg.classList.remove('changing');
      this.resetZoomPan();
    }, 150);
  }

  resetZoomPan() {
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
  }

  updateCounter() {
    this.counter.textContent = `${this.currentIndex + 1} of ${this.images.length}`;
  }

  createThumbnails() {
    this.thumbnails.innerHTML = '';
    this.images.forEach((src, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'lightbox-thumb';
      if (i === this.currentIndex) thumb.classList.add('active');
      thumb.innerHTML = `<img src="${src}" alt="">`;
      thumb.addEventListener('click', () => this.jumpTo(i));
      this.thumbnails.appendChild(thumb);
    });

    this.scrollActiveThumbIntoView();
  }

  updateThumbnails() {
    const thumbs = this.thumbnails.querySelectorAll('.lightbox-thumb');
    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === this.currentIndex);
    });
    this.scrollActiveThumbIntoView();
  }

  scrollActiveThumbIntoView() {
    const activeThumb = this.thumbnails.querySelector('.lightbox-thumb.active');
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }

  jumpTo(index) {
    this.lbimg.classList.add('changing');
    setTimeout(() => {
      this.currentIndex = index;
      this.lbimg.src = this.images[this.currentIndex];
      this.updateCounter();
      this.updateThumbnails();
      this.preloadImages();
      this.lbimg.classList.remove('changing');
      this.resetZoomPan();
    }, 150);
  }

  preloadImages() {
    const nextIdx = (this.currentIndex + 1) % this.images.length;
    const prevIdx = (this.currentIndex - 1 + this.images.length) % this.images.length;

    if (!this.preloadNext || this.preloadNext.src !== this.images[nextIdx]) {
      this.preloadNext = new Image();
      this.preloadNext.src = this.images[nextIdx];
    }

    if (!this.preloadPrev || this.preloadPrev.src !== this.images[prevIdx]) {
      this.preloadPrev = new Image();
      this.preloadPrev.src = this.images[prevIdx];
    }
  }

  updateTransform() {
    this.lbimg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
  }

  download() {
    const a = document.createElement('a');
    a.href = this.images[this.currentIndex];
    a.download = this.images[this.currentIndex].split('/').pop();
    a.click();

    // Show success message
    const success = document.createElement('div');
    success.className = 'download-success';
    success.textContent = '✓ Downloaded!';
    document.body.appendChild(success);
    setTimeout(() => success.remove(), 2000);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.lb.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
}

// Kodachrome effect toggle
function initKodachromeToggle() {
  const toggle = document.createElement('button');
  toggle.id = 'kodachromeToggle';
  toggle.title = 'Toggle Film Effect';
  toggle.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M20 6h-2.8l-1.4-2H8.2L6.8 6H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/>
    </svg>
  `;
  toggle.addEventListener('click', () => {
    document.body.classList.toggle('kodachrome');
  });
  document.body.appendChild(toggle);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.AdvancedLightbox = new AdvancedLightbox();
    initKodachromeToggle();
  });
} else {
  window.AdvancedLightbox = new AdvancedLightbox();
  initKodachromeToggle();
}
