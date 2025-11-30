/**
 * Admin Panel - Complete Implementation
 * Fully functional content management
 */

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
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
      this.setupAboutEditor();
      this.setupArticleEditor();
      this.setupUploadHandlers();
    } else {
      this.showLogin();
    }
  }

  // ==================== AUTHENTICATION ====================

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
      this.setupArticleEditor();
    } else {
      this.loginError.textContent = 'Invalid username or password';
      this.loginError.style.display = 'block';
      document.getElementById('password').value = '';
    }
  }

  handleLogout() {
    sessionStorage.removeItem('adminAuth');
    this.isAuthenticated = false;
    this.showLogin();
    this.loginForm.reset();
  }

  checkAuth() {
    const auth = sessionStorage.getItem('adminAuth');
    return auth ? JSON.parse(auth).authenticated : false;
  }

  showLogin() {
    this.loginScreen.style.display = 'flex';
    this.adminDashboard.style.display = 'none';
    document.getElementById('username').focus();
  }

  showDashboard() {
    this.loginScreen.style.display = 'none';
    this.adminDashboard.style.display = 'block';
  }

  // ==================== EVENT LISTENERS ====================

  setupEventListeners() {
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.logoutBtn.addEventListener('click', () => this.handleLogout());

    // Tab switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
  }

  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
      tab.classList.remove('active');
    });

    // Remove active from buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load tab-specific content
    if (tabName === 'videos') {
      this.loadVideos();
    } else if (tabName === 'gallery') {
      this.loadGallery();
    }
  }

  // ==================== DASHBOARD & STATS ====================

  async loadStats() {
    try {
      let galleryCount = 0;
      let videosCount = 0;

      // Try to load gallery from new structure (images/gallery/)
      try {
        const galleryResponse = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/gallery');
        if (galleryResponse.ok) {
          const folders = await galleryResponse.json();
          // Count images in all collections
          for (const folder of folders) {
            if (folder.type === 'dir') {
              const collectionResponse = await fetch(folder.url);
              const files = await collectionResponse.json();
              if (Array.isArray(files)) {
                galleryCount += files.filter(f => this.isImageFile(f.name)).length;
              }
            }
          }
        }
      } catch (e) {
        console.log('Gallery load from API failed, using local');
      }

      // Load videos
      try {
        const videosResponse = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/videos/large');
        if (videosResponse.ok) {
          const videoFiles = await videosResponse.json();
          videosCount = Array.isArray(videoFiles) ? videoFiles.filter(f => this.isVideoFile(f.name)).length : 0;
        }
      } catch (e) {
        console.log('Videos load failed');
      }

      // Load articles from localStorage
      const articles = JSON.parse(localStorage.getItem('articles') || '[]');
      const articlesCount = articles.length;

      // Update UI
      document.getElementById('galleryCount').textContent = galleryCount;
      document.getElementById('videosCount').textContent = videosCount;
      const articleStatEl = document.querySelector('[data-stat="articles"]');
      if (articleStatEl) {
        articleStatEl.textContent = articlesCount;
      }

      // Estimate storage
      const totalSize = (galleryCount * 2) + (videosCount * 50);
      document.getElementById('storageUsed').textContent = (totalSize / 1024).toFixed(1) + ' MB';
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  // ==================== ABOUT EDITOR ====================

  setupAboutEditor() {
    const form = document.getElementById('aboutForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleAboutSubmit(e));
      this.loadAboutContent();
    }
  }

  loadAboutContent() {
    const stored = localStorage.getItem('aboutContent');
    if (stored) {
      const content = JSON.parse(stored);
      document.getElementById('aboutTextMain').value = content.textMain || '';
      document.getElementById('aboutImageUrl').value = content.imageUrl || '';
      document.getElementById('aboutImageName').value = content.imageName || '';
      document.getElementById('aboutTextBottom').value = content.textBottom || '';
    }
  }

  handleAboutSubmit(e) {
    e.preventDefault();

    const content = {
      textMain: document.getElementById('aboutTextMain').value,
      imageUrl: document.getElementById('aboutImageUrl').value,
      imageName: document.getElementById('aboutImageName').value,
      textBottom: document.getElementById('aboutTextBottom').value,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem('aboutContent', JSON.stringify(content));
    this.showNotification('About content saved successfully!');
  }

  // ==================== ARTICLE EDITOR ====================

  setupArticleEditor() {
    const form = document.getElementById('articleForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    if (form) {
      form.addEventListener('submit', (e) => this.handleArticleSubmit(e));
      if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => this.cancelArticleEdit());
      }
    }

    this.loadArticlesList();
  }

  handleArticleSubmit(e) {
    e.preventDefault();

    const form = document.getElementById('articleForm');
    const editingId = form.dataset.editingId;

    const article = {
      id: editingId || Date.now().toString(),
      title: document.getElementById('articleTitle').value.trim(),
      category: document.getElementById('articleCategory').value.trim(),
      author: document.getElementById('articleAuthor').value.trim(),
      excerpt: document.getElementById('articleExcerpt').value.trim(),
      body: document.getElementById('articleBody').value.trim(),
      thumbnail: document.getElementById('articleThumbnail').value.trim(),
      date: editingId ? this.getArticleById(editingId).date : new Date().toISOString()
    };

    if (!article.title || !article.author || !article.body) {
      this.showNotification('Please fill in all required fields', 'error');
      return;
    }

    let articles = JSON.parse(localStorage.getItem('articles') || '[]');

    if (editingId) {
      articles = articles.map(a => a.id === editingId ? article : a);
      this.showNotification('Article updated successfully!');
      this.cancelArticleEdit();
    } else {
      articles.push(article);
      this.showNotification('Article created successfully!');
    }

    localStorage.setItem('articles', JSON.stringify(articles));
    form.reset();
    this.loadArticlesList();
  }

  loadArticlesList() {
    const articlesList = document.getElementById('articlesList');
    const articles = JSON.parse(localStorage.getItem('articles') || '[]');

    if (articles.length === 0) {
      articlesList.innerHTML = '<p class="loading">No articles yet. Create your first article!</p>';
      return;
    }

    articlesList.innerHTML = articles
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(article => `
        <div class="article-item">
          <div class="article-item-info">
            <h4 class="article-item-title">${this.escapeHtml(article.title)}</h4>
            <div class="article-item-meta">
              <span>${this.formatDate(article.date)}</span>
              <span>By ${this.escapeHtml(article.author)}</span>
              ${article.category ? `<span>${this.escapeHtml(article.category)}</span>` : ''}
            </div>
          </div>
          <div class="article-item-actions">
            <button class="article-btn article-btn-edit" data-id="${article.id}">Edit</button>
            <button class="article-btn article-btn-delete" data-id="${article.id}">Delete</button>
          </div>
        </div>
      `).join('');

    // Add event listeners
    document.querySelectorAll('.article-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => this.editArticle(btn.dataset.id));
    });

    document.querySelectorAll('.article-btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this article? This cannot be undone.')) {
          this.deleteArticle(btn.dataset.id);
        }
      });
    });
  }

  editArticle(id) {
    const article = this.getArticleById(id);
    if (!article) return;

    document.getElementById('articleTitle').value = article.title;
    document.getElementById('articleCategory').value = article.category || '';
    document.getElementById('articleAuthor').value = article.author;
    document.getElementById('articleExcerpt').value = article.excerpt || '';
    document.getElementById('articleBody').value = article.body;
    document.getElementById('articleThumbnail').value = article.thumbnail || '';

    const form = document.getElementById('articleForm');
    form.dataset.editingId = id;
    document.getElementById('editorTitle').textContent = 'Edit Article';
    document.getElementById('submitBtn').textContent = 'Update Article';
    document.getElementById('cancelEditBtn').style.display = 'block';

    document.querySelector('.article-editor-section').scrollIntoView({ behavior: 'smooth' });
  }

  deleteArticle(id) {
    let articles = JSON.parse(localStorage.getItem('articles') || '[]');
    articles = articles.filter(a => a.id !== id);
    localStorage.setItem('articles', JSON.stringify(articles));
    this.loadArticlesList();
    this.showNotification('Article deleted successfully!');
  }

  cancelArticleEdit() {
    const form = document.getElementById('articleForm');
    form.reset();
    delete form.dataset.editingId;
    document.getElementById('editorTitle').textContent = 'Create New Article';
    document.getElementById('submitBtn').textContent = 'Create Article';
    document.getElementById('cancelEditBtn').style.display = 'none';
  }

  getArticleById(id) {
    const articles = JSON.parse(localStorage.getItem('articles') || '[]');
    return articles.find(a => a.id === id);
  }

  // ==================== VIDEO MANAGEMENT ====================

  async loadVideos() {
    const videoList = document.getElementById('videoList');
    videoList.innerHTML = '<p class="loading">Loading videos...</p>';

    try {
      const response = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/videos/large');
      const files = await response.json();

      if (!Array.isArray(files)) {
        videoList.innerHTML = '<p class="loading">No videos found.</p>';
        return;
      }

      const videoFiles = files.filter(f => this.isVideoFile(f.name));

      if (videoFiles.length === 0) {
        videoList.innerHTML = '<p class="loading">No videos in library. Upload to images/videos/large/</p>';
        return;
      }

      videoList.innerHTML = videoFiles.map(file => `
        <div class="file-item">
          <div class="file-thumbnail" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px;">
            ▶
          </div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${this.formatFileSize(file.size)}</div>
            <div class="file-actions">
              <a href="images/videos/large/${file.name}" target="_blank" class="file-action-btn">Watch</a>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading videos:', error);
      videoList.innerHTML = '<p class="loading">Error loading videos.</p>';
    }
  }

  // ==================== GALLERY MANAGEMENT ====================

  async loadGallery() {
    const galleryList = document.getElementById('galleryList');
    galleryList.innerHTML = '<p class="loading">Loading gallery...</p>';

    try {
      const response = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/gallery');
      const folders = await response.json();

      if (!Array.isArray(folders)) {
        galleryList.innerHTML = '<p class="loading">No collections found.</p>';
        return;
      }

      const collections = folders.filter(f => f.type === 'dir');

      if (collections.length === 0) {
        galleryList.innerHTML = '<p class="loading">No collections. Create folders in images/gallery/</p>';
        return;
      }

      let allImages = [];

      // Load images from all collections
      for (const collection of collections) {
        try {
          const collResponse = await fetch(collection.url);
          const files = await collResponse.json();
          if (Array.isArray(files)) {
            const images = files.filter(f => this.isImageFile(f.name));
            allImages = allImages.concat(images.map(img => ({
              name: img.name,
              collection: collection.name,
              size: img.size
            })));
          }
        } catch (e) {
          console.error('Error loading collection:', collection.name);
        }
      }

      if (allImages.length === 0) {
        galleryList.innerHTML = '<p class="loading">No images in any collection.</p>';
        return;
      }

      galleryList.innerHTML = allImages.map(file => `
        <div class="file-item">
          <div class="file-thumbnail">
            <img src="images/gallery/${file.collection}/${file.name}" alt="${file.name}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${this.formatFileSize(file.size)}</div>
            <div class="file-collection">${file.collection}</div>
            <div class="file-actions">
              <a href="images/gallery/${file.collection}/${file.name}" target="_blank" class="file-action-btn">View</a>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading gallery:', error);
      galleryList.innerHTML = '<p class="loading">Error loading gallery.</p>';
    }
  }

  // ==================== UPLOAD HANDLERS ====================

  setupUploadHandlers() {
    const videoUploadArea = document.getElementById('videoUploadArea');
    const galleryUploadArea = document.getElementById('galleryUploadArea');

    if (videoUploadArea) {
      videoUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
      videoUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      videoUploadArea.addEventListener('drop', (e) => this.handleUploadDrop(e, 'video'));
    }

    if (galleryUploadArea) {
      galleryUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
      galleryUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      galleryUploadArea.addEventListener('drop', (e) => this.handleUploadDrop(e, 'gallery'));
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

  handleUploadDrop(e, type) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    this.showNotification(
      `${files.length} file${files.length !== 1 ? 's' : ''} selected. ` +
      `To upload, push to GitHub:\n\n` +
      `Videos: push to images/videos/large/\n` +
      `Gallery: push to images/gallery/[collection-name]/`,
      'info'
    );
  }

  // ==================== UTILITY FUNCTIONS ====================

  isVideoFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'flv', 'wmv'].includes(ext);
  }

  isImageFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = 'success') {
    alert(message);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new AdminPanel();
});
