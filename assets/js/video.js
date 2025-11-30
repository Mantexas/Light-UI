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
        // If videos folder doesn't exist, show message
        if (response.status === 404) {
          this.imageCounter.textContent = 'No videos found. Create images/videos/large/ folder and add video files.';
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
        this.imageCounter.textContent = 'No video files found in images/videos/large/';
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
        description: `A visual essay exploring light and composition`
      }));

      this.renderVideos();
      this.updateVideoCount();
    } catch (error) {
      console.error('Error loading videos:', error);
      this.imageCounter.textContent = 'Error loading videos. Please check console.';
    }
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

    // Show modal and play
    this.videoModal.classList.add('active');
    this.videoPlayer.play();

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
    this.videoPlayer.pause();
    this.videoPlayer.currentTime = 0;
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
