/**
 * Video Gallery Loader
 * Fetches videos from GitHub API and displays them in a grid
 * Supports MP4, WebM, and other HTML5 video formats
 */

class VideoGallery {
  constructor() {
    this.videos = [];
    this.videoGrid = document.querySelector('.video-grid');
    this.videoModal = document.getElementById('videoModal');
    this.videoPlayer = document.getElementById('video-player');
    this.videoTitle = document.getElementById('video-title');
    this.videoDescription = document.getElementById('video-description');
    this.imageCounter = document.querySelector('.image-counter');
    this.modalCloseBtn = document.querySelector('.video-modal-close');

    this.init();
  }

  async init() {
    await this.detectVideos();
    this.setupEventListeners();
  }

  /**
   * Fetch video files from GitHub API
   * Looks for videos in images/videos/large directory
   */
  async detectVideos() {
    try {
      const apiUrl = 'https://api.github.com/repos/Mantexas/Light-UI/contents/images/videos/large';
      const response = await fetch(apiUrl);

      if (!response.ok) {
        // If videos folder doesn't exist, add sample YouTube video
        if (response.status === 404) {
          this.addSampleYouTubeVideo();
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const files = await response.json();

      // Filter for video files
      const videoFiles = files.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext);
      });

      if (videoFiles.length === 0) {
        this.addSampleYouTubeVideo();
        return;
      }

      // Create video objects with metadata
      this.videos = videoFiles.map(file => ({
        id: file.name,
        name: this.formatFileName(file.name),
        filename: file.name,
        url: `images/videos/large/${file.name}`,
        ext: file.name.split('.').pop().toLowerCase(),
        thumbnail: this.getThumbnailUrl(file.name),
        description: `A visual essay exploring light and composition`,
        type: 'local'
      }));

      this.renderVideos();
      this.updateVideoCount();
    } catch (error) {
      console.error('Error loading videos:', error);
      this.addSampleYouTubeVideo();
    }
  }

  /**
   * Add sample YouTube video
   */
  addSampleYouTubeVideo() {
    this.videos = [{
      id: 'GFQbXdiB7vk',
      name: 'Featured Film',
      url: 'https://www.youtube.com/embed/GFQbXdiB7vk',
      thumbnail: 'https://img.youtube.com/vi/GFQbXdiB7vk/maxresdefault.jpg',
      description: 'Visual storytelling and cinematic exploration',
      type: 'youtube'
    }];

    this.renderVideos();
    this.updateVideoCount();
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    this.videoGrid.innerHTML = `
      <div class="video-empty-state" style="grid-column: 1 / -1;">
        <p>Coming Soon</p>
        <p class="video-empty-state-subtitle">We're currently working on building our film collection. Check back soon to explore cinematic visual essays.</p>
      </div>
    `;
    this.imageCounter.textContent = 'No videos available yet';
  }

  /**
   * Get thumbnail URL for video
   * For now, uses a placeholder or checks for corresponding image file
   */
  getThumbnailUrl(videoFilename) {
    // Try to find a matching image file for thumbnail
    const baseName = videoFilename.split('.')[0];
    // You can customize this logic - for example:
    // - Generate a thumbnail from first frame of video (requires backend)
    // - Use a matching image file (image_name.jpg for image_name.mp4)
    // - Use a placeholder image
    return `images/large/${baseName}.jpg`;
  }

  /**
   * Format filename to readable title
   */
  formatFileName(filename) {
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/_/g, ' ')        // Replace underscores with spaces
      .replace(/-/g, ' ')        // Replace dashes with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
  }

  /**
   * Render video grid
   */
  renderVideos() {
    this.videoGrid.innerHTML = '';

    this.videos.forEach((video, index) => {
      const videoItem = document.createElement('div');
      videoItem.className = 'video-item';
      videoItem.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.name}" class="video-item-thumbnail" loading="lazy">
        <div class="video-play-button"></div>
        <div class="video-duration">PLAY</div>
        <div class="video-item-title">${video.name}</div>
      `;

      videoItem.addEventListener('click', () => this.playVideo(video));
      this.videoGrid.appendChild(videoItem);
    });
  }

  /**
   * Play video in modal
   */
  playVideo(video) {
    this.videoTitle.textContent = video.name;
    this.videoDescription.textContent = video.description;

    const modalContent = this.videoModal.querySelector('.video-modal-content');

    if (video.type === 'youtube') {
      // Hide HTML5 video player and show YouTube iframe
      this.videoPlayer.style.display = 'none';

      // Remove existing iframe if any
      const existingIframe = modalContent.querySelector('.youtube-iframe');
      if (existingIframe) {
        existingIframe.remove();
      }

      // Create YouTube iframe
      const iframe = document.createElement('iframe');
      iframe.className = 'youtube-iframe';
      iframe.src = video.url + '?autoplay=1';
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;';

      // Insert iframe before video info
      const videoInfo = modalContent.querySelector('.video-info');
      modalContent.insertBefore(iframe, videoInfo);
    } else {
      // Show HTML5 video player
      this.videoPlayer.style.display = 'block';

      // Remove YouTube iframe if any
      const existingIframe = modalContent.querySelector('.youtube-iframe');
      if (existingIframe) {
        existingIframe.remove();
      }

      // Clear previous sources
      this.videoPlayer.innerHTML = '';

      // Add video source with fallback
      const source = document.createElement('source');
      source.src = video.url;
      source.type = this.getMimeType(video.ext);
      this.videoPlayer.appendChild(source);

      // Add fallback text
      const fallback = document.createElement('p');
      fallback.textContent = 'Your browser doesn\'t support this video format. Please try a different browser or download the video.';
      this.videoPlayer.appendChild(fallback);

      this.videoPlayer.play();
    }

    // Show modal
    this.videoModal.classList.add('active');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Get MIME type for video format
   */
  getMimeType(ext) {
    const mimeTypes = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      'mkv': 'video/x-matroska',
      'avi': 'video/x-msvideo',
      'hevc': 'video/hevc',
      'm4v': 'video/mp4'
    };
    return mimeTypes[ext] || 'video/mp4';
  }

  /**
   * Close video modal
   */
  closeModal() {
    this.videoModal.classList.remove('active');

    // Stop HTML5 video
    this.videoPlayer.pause();
    this.videoPlayer.currentTime = 0;

    // Remove YouTube iframe if present
    const iframe = this.videoModal.querySelector('.youtube-iframe');
    if (iframe) {
      iframe.remove();
    }

    document.body.style.overflow = '';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    this.modalCloseBtn.addEventListener('click', () => this.closeModal());

    // Click outside modal content
    this.videoModal.addEventListener('click', (e) => {
      if (e.target === this.videoModal) {
        this.closeModal();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.videoModal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  /**
   * Update video counter
   */
  updateVideoCount() {
    const count = this.videos.length;
    if (count === 0) {
      this.imageCounter.textContent = 'No videos available';
    } else {
      this.imageCounter.textContent = `${count} video${count !== 1 ? 's' : ''}`;
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new VideoGallery();
});
