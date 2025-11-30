/**
 * Admin Panel
 * Simple authentication and dashboard for managing content
 */

// SECURITY NOTE: This is client-side authentication suitable for a portfolio/low-security context
// For production sites, use server-side authentication

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'password123' // CHANGE THIS to something more secure
};

class AdminPanel {
  constructor() {
    this.loginScreen = document.getElementById('loginScreen');
    this.adminDashboard = document.getElementById('adminDashboard');
    this.loginForm = document.getElementById('loginForm');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.loginError = document.getElementById('loginError');

    this.isAuthenticated = this.checkAuth();
    this.init();
  }

  init() {
    this.setupEventListeners();

    if (this.isAuthenticated) {
      this.showDashboard();
      this.loadStats();
    } else {
      this.showLogin();
    }
  }

  setupEventListeners() {
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.logoutBtn.addEventListener('click', () => this.handleLogout());

    // Tab switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Upload areas
    this.setupUploadHandlers();
  }

  /**
   * Handle login form submission
   */
  handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      this.loginError.style.display = 'none';
      sessionStorage.setItem('adminAuth', JSON.stringify({ authenticated: true, timestamp: Date.now() }));
      this.isAuthenticated = true;
      this.showDashboard();
      this.loadStats();
    } else {
      this.loginError.textContent = 'Invalid username or password';
      this.loginError.style.display = 'block';
      document.getElementById('password').value = '';
    }
  }

  /**
   * Handle logout
   */
  handleLogout() {
    sessionStorage.removeItem('adminAuth');
    this.isAuthenticated = false;
    this.showLogin();
    this.loginForm.reset();
  }

  /**
   * Check if user is authenticated
   */
  checkAuth() {
    const auth = sessionStorage.getItem('adminAuth');
    return auth ? JSON.parse(auth).authenticated : false;
  }

  /**
   * Show login screen
   */
  showLogin() {
    this.loginScreen.style.display = 'flex';
    this.adminDashboard.style.display = 'none';
    document.getElementById('username').focus();
  }

  /**
   * Show admin dashboard
   */
  showDashboard() {
    this.loginScreen.style.display = 'none';
    this.adminDashboard.style.display = 'block';
  }

  /**
   * Switch tab
   */
  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
      tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');

    // Add active class to button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load content for specific tabs
    if (tabName === 'videos') {
      this.loadVideos();
    } else if (tabName === 'gallery') {
      this.loadGallery();
    }
  }

  /**
   * Load dashboard statistics
   */
  async loadStats() {
    try {
      // Load gallery count
      const galleryResponse = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/large');
      const galleryFiles = await galleryResponse.json();
      const galleryCount = Array.isArray(galleryFiles) ? galleryFiles.length : 0;
      document.getElementById('galleryCount').textContent = galleryCount;

      // Load video count
      const videosResponse = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/videos/large');
      const videoFiles = await videosResponse.json();
      const videosCount = Array.isArray(videoFiles) ? videoFiles.filter(f => this.isVideoFile(f.name)).length : 0;
      document.getElementById('videosCount').textContent = videosCount;

      // Estimate storage
      const totalSize = (galleryFiles.length * 2) + (videoFiles.length * 50); // Rough estimate
      document.getElementById('storageUsed').textContent = (totalSize / 1024).toFixed(1) + ' MB';
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  /**
   * Load videos list
   */
  async loadVideos() {
    const videoList = document.getElementById('videoList');
    videoList.innerHTML = '<p class="loading">Loading videos...</p>';

    try {
      const response = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/videos/large');
      const files = await response.json();

      if (!Array.isArray(files)) {
        videoList.innerHTML = '<p class="loading">No videos found. Create the images/videos/large/ folder.</p>';
        return;
      }

      const videoFiles = files.filter(f => this.isVideoFile(f.name));

      if (videoFiles.length === 0) {
        videoList.innerHTML = '<p class="loading">No videos found in library.</p>';
        return;
      }

      videoList.innerHTML = videoFiles.map(file => `
        <div class="file-item">
          <div class="file-thumbnail" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${this.formatFileSize(file.size)}</div>
            <div class="file-actions">
              <a href="images/videos/large/${file.name}" target="_blank" class="file-action-btn">View</a>
              <a href="images/videos/large/${file.name}" download class="file-action-btn">Download</a>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading videos:', error);
      videoList.innerHTML = '<p class="loading">Error loading videos. Check console.</p>';
    }
  }

  /**
   * Load gallery images list
   */
  async loadGallery() {
    const galleryList = document.getElementById('galleryList');
    galleryList.innerHTML = '<p class="loading">Loading gallery...</p>';

    try {
      const response = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/large');
      const files = await response.json();

      if (!Array.isArray(files)) {
        galleryList.innerHTML = '<p class="loading">No images found.</p>';
        return;
      }

      const imageFiles = files.filter(f => this.isImageFile(f.name));

      if (imageFiles.length === 0) {
        galleryList.innerHTML = '<p class="loading">No images found in gallery.</p>';
        return;
      }

      galleryList.innerHTML = imageFiles.map(file => `
        <div class="file-item">
          <img src="images/large/${file.name}" alt="${file.name}" class="file-thumbnail" onerror="this.style.background='#ddd';">
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${this.formatFileSize(file.size)}</div>
            <div class="file-actions">
              <a href="images/large/${file.name}" target="_blank" class="file-action-btn">View</a>
              <a href="images/large/${file.name}" download class="file-action-btn">Download</a>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading gallery:', error);
      galleryList.innerHTML = '<p class="loading">Error loading gallery. Check console.</p>';
    }
  }

  /**
   * Setup upload handlers
   */
  setupUploadHandlers() {
    // Video upload
    const videoUploadArea = document.getElementById('videoUploadArea');
    const videoInput = document.getElementById('videoInput');

    if (videoUploadArea) {
      videoUploadArea.addEventListener('click', () => videoInput.click());
      videoUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
      videoUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      videoUploadArea.addEventListener('drop', (e) => this.handleVideoDrop(e));
    }

    // Gallery upload
    const galleryUploadArea = document.getElementById('galleryUploadArea');
    const galleryInput = document.getElementById('galleryInput');

    if (galleryUploadArea) {
      galleryUploadArea.addEventListener('click', () => galleryInput.click());
      galleryUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
      galleryUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      galleryUploadArea.addEventListener('drop', (e) => this.handleGalleryDrop(e));
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
  }

  handleVideoDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    this.showUploadMessage('Video files must be uploaded via Git or FTP. Drag and drop is for reference only.');
  }

  handleGalleryDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    this.showUploadMessage('Gallery files must be uploaded via Git or FTP. Drag and drop is for reference only.');
  }

  showUploadMessage(message) {
    alert(message);
  }

  /**
   * Check if file is video
   */
  isVideoFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext);
  }

  /**
   * Check if file is image
   */
  isImageFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Initialize admin panel on load
document.addEventListener('DOMContentLoaded', () => {
  new AdminPanel();
});
