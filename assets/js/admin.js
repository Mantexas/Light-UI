/**
 * Admin Panel - Complete Implementation
 * Full CMS for managing gallery, articles, videos, and content
 */

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

// ==================== TOAST NOTIFICATION SYSTEM ====================

class Toast {
  static container = null;

  static init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  static show(message, type = 'success', duration = 4000) {
    this.init();

    const icons = {
      success: '✓',
      error: '✕',
      warning: '!',
      info: 'i'
    };

    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <p class="toast-title">${titles[type]}</p>
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close">×</button>
    `;

    this.container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }

    return toast;
  }

  static dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('exiting');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }

  static success(message) { return this.show(message, 'success'); }
  static error(message) { return this.show(message, 'error'); }
  static warning(message) { return this.show(message, 'warning'); }
  static info(message) { return this.show(message, 'info'); }
}

// ==================== MAIN ADMIN PANEL CLASS ====================

class AdminPanel {
  constructor() {
    this.loginScreen = document.getElementById('loginScreen');
    this.adminDashboard = document.getElementById('adminDashboard');
    this.loginForm = document.getElementById('loginForm');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.loginError = document.getElementById('loginError');

    this.currentCollection = null;
    this.currentSortMethod = 'name';
    this.selectedImages = new Set();

    this.isAuthenticated = this.checkAuth();
    this.init();
  }

  init() {
    this.setupEventListeners();

    if (this.isAuthenticated) {
      this.showDashboard();
      this.loadStats();
      this.setupHomepageEditor();
      this.setupAboutEditor();
      this.setupArticleEditor();
      this.setupGalleryManagement();
      this.setupVideoManagement();
      this.setupSettingsTab();
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
      this.setupHomepageEditor();
      this.setupAboutEditor();
      this.setupArticleEditor();
      this.setupGalleryManagement();
      this.setupVideoManagement();
      this.setupSettingsTab();
      Toast.success('Welcome back, Admin!');
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
    Toast.info('You have been logged out');
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
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
      tab.classList.remove('active');
    });

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    document.getElementById(tabName + 'Tab').classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load tab-specific content
    if (tabName === 'videos') {
      this.loadVideos();
    } else if (tabName === 'gallery') {
      this.loadGalleryCollections();
    } else if (tabName === 'dashboard') {
      this.loadStats();
    }
  }

  // ==================== DASHBOARD & STATS ====================

  async loadStats() {
    const galleryCountEl = document.getElementById('galleryCount');
    const videosCountEl = document.getElementById('videosCount');
    const articleStatEl = document.querySelector('[data-stat="articles"]');
    const storageEl = document.getElementById('storageUsed');

    // Show loading state
    if (galleryCountEl) galleryCountEl.textContent = '...';
    if (videosCountEl) videosCountEl.textContent = '...';

    let galleryCount = 0;
    let videosCount = 0;

    // Count gallery images from localStorage
    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    Object.values(galleries).forEach(collection => {
      galleryCount += collection.length;
    });

    // Try to also count from GitHub API
    try {
      const response = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images');
      if (response.ok) {
        const folders = await response.json();
        if (Array.isArray(folders)) {
          for (const folder of folders) {
            if (folder.type === 'dir' && folder.name !== 'homepage' && folder.name !== 'videos') {
              try {
                const collResponse = await fetch(folder.url);
                const files = await collResponse.json();
                if (Array.isArray(files)) {
                  galleryCount += files.filter(f => this.isImageFile(f.name)).length;
                }
              } catch (e) { /* ignore */ }
            }
          }
        }
      }
    } catch (e) {
      console.log('GitHub API unavailable, using local data only');
    }

    // Count videos
    try {
      const videosResponse = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/videos/large');
      if (videosResponse.ok) {
        const videoFiles = await videosResponse.json();
        videosCount = Array.isArray(videoFiles) ? videoFiles.filter(f => this.isVideoFile(f.name)).length : 0;
      }
    } catch (e) { /* ignore */ }

    // Count articles
    const articles = JSON.parse(localStorage.getItem('articles') || '[]');
    const articlesCount = articles.length;

    // Update UI
    if (galleryCountEl) galleryCountEl.textContent = galleryCount;
    if (videosCountEl) videosCountEl.textContent = videosCount;
    if (articleStatEl) articleStatEl.textContent = articlesCount;

    // Calculate storage used
    let totalBytes = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalBytes += localStorage.getItem(key).length * 2; // UTF-16
        }
      }
    } catch (e) { /* ignore */ }

    const mbUsed = (totalBytes / (1024 * 1024)).toFixed(2);
    if (storageEl) storageEl.textContent = `${mbUsed} MB`;
  }

  // ==================== HOMEPAGE EDITOR ====================

  setupHomepageEditor() {
    const form = document.getElementById('homepageForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleHomepageSubmit(e));
      document.getElementById('homepageResetBtn')?.addEventListener('click', (e) => this.handleHomepageReset(e));
      this.loadHomepageContent();
    }
  }

  loadHomepageContent() {
    const defaults = {
      heroTitle: 'Immerse yourself in a curated selection of fine art pieces that capture nature\'s beauty.',
      heroDescription: 'Meticulously crafted and printed directly on exceptional materials such as aluminum, glass, or the finest Hahnemühle paper, each piece tells its own story, offering a moment of reflection, wonder, and connection, designed to last 100 years.',
      ctaButtonText: 'VISIT GALLERY',
      ctaButtonLink: 'color.html'
    };

    const stored = localStorage.getItem('homepageContent');
    const content = stored ? JSON.parse(stored) : defaults;

    document.getElementById('heroTitle').value = content.heroTitle || defaults.heroTitle;
    document.getElementById('heroDescription').value = content.heroDescription || defaults.heroDescription;
    document.getElementById('ctaButtonText').value = content.ctaButtonText || defaults.ctaButtonText;
    document.getElementById('ctaButtonLink').value = content.ctaButtonLink || defaults.ctaButtonLink;
  }

  handleHomepageSubmit(e) {
    e.preventDefault();

    const content = {
      heroTitle: document.getElementById('heroTitle').value.trim(),
      heroDescription: document.getElementById('heroDescription').value.trim(),
      ctaButtonText: document.getElementById('ctaButtonText').value.trim(),
      ctaButtonLink: document.getElementById('ctaButtonLink').value.trim(),
      lastUpdated: new Date().toISOString()
    };

    if (!content.heroTitle || !content.heroDescription || !content.ctaButtonText || !content.ctaButtonLink) {
      Toast.error('All fields are required');
      return;
    }

    localStorage.setItem('homepageContent', JSON.stringify(content));
    Toast.success('Homepage content saved! Refresh homepage to see changes.');
  }

  handleHomepageReset(e) {
    e.preventDefault();
    localStorage.removeItem('homepageContent');
    this.loadHomepageContent();
    Toast.info('Homepage content reset to defaults');
  }

  // ==================== ABOUT EDITOR ====================

  setupAboutEditor() {
    const form = document.getElementById('aboutForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleAboutSubmit(e));
      document.getElementById('aboutResetBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        form.reset();
        Toast.info('Form cleared');
      });
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
    Toast.success('About content saved!');
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

    this.setupMarkdownToolbar();
    this.setupLivePreview();
    this.setupFeaturedImageSelector();
    this.loadArticlesList();
  }

  setupMarkdownToolbar() {
    const toolbar = document.querySelectorAll('.toolbar-btn');
    const textarea = document.getElementById('articleBody');

    if (!textarea) return;

    toolbar.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const command = btn.dataset.command;
        this.insertMarkdown(textarea, command);
        textarea.focus();
      });
    });
  }

  insertMarkdown(textarea, command) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    let result = '';
    let newCursorPos = start;

    switch (command) {
      case 'bold':
        result = before + `**${selectedText || 'bold text'}**` + after;
        newCursorPos = start + 2;
        break;
      case 'italic':
        result = before + `*${selectedText || 'italic text'}*` + after;
        newCursorPos = start + 1;
        break;
      case 'h1':
        result = before + `# ${selectedText || 'Heading'}` + after;
        newCursorPos = start + 2;
        break;
      case 'h2':
        result = before + `## ${selectedText || 'Heading'}` + after;
        newCursorPos = start + 3;
        break;
      case 'link':
        result = before + `[${selectedText || 'link text'}](url)` + after;
        break;
      case 'quote':
        result = before + `> ${selectedText || 'quote'}` + after;
        newCursorPos = start + 2;
        break;
      case 'code':
        result = before + `\`${selectedText || 'code'}\`` + after;
        break;
      case 'ul':
        const lines = selectedText.split('\n');
        const bulletedLines = lines.map(line => `* ${line}`).join('\n');
        result = before + (bulletedLines || '* item') + after;
        break;
    }

    textarea.value = result;
    textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    this.updateLivePreview();
  }

  setupLivePreview() {
    const textarea = document.getElementById('articleBody');
    const titleInput = document.getElementById('articleTitle');

    if (!textarea) return;

    textarea.addEventListener('input', () => this.updateLivePreview());
    if (titleInput) {
      titleInput.addEventListener('input', () => this.updateLivePreview());
    }
  }

  updateLivePreview() {
    const title = document.getElementById('articleTitle')?.value || '';
    const body = document.getElementById('articleBody')?.value || '';
    const preview = document.getElementById('articlePreview');

    if (!preview) return;

    let html = '';
    if (title) {
      html += `<h1>${this.escapeHtml(title)}</h1>`;
    }

    if (body) {
      html += this.parseMarkdown(body);
    }

    if (!html) {
      html = '<p style="color: var(--text-secondary); text-align: center; padding: 32px;">Start typing to see preview...</p>';
    }

    preview.innerHTML = html;
    this.updateEditorStats();
  }

  updateEditorStats() {
    const body = document.getElementById('articleBody')?.value || '';
    const wordCount = body.trim().split(/\s+/).filter(w => w).length;
    const readingTime = Math.ceil(wordCount / 200);

    const wordCountEl = document.getElementById('wordCount');
    const readingTimeEl = document.getElementById('readingTime');

    if (wordCountEl) wordCountEl.textContent = `${wordCount} words`;
    if (readingTimeEl) readingTimeEl.textContent = `~ ${readingTime} min read`;
  }

  setupFeaturedImageSelector() {
    const openBtn = document.getElementById('openImageLibraryBtn');
    const uploadBtn = document.getElementById('uploadImageBtn');
    const clearBtn = document.getElementById('clearImageBtn');
    const imageInput = document.getElementById('articleImageUpload');
    const modal = document.getElementById('imageLibraryModal');
    const modalClose = modal?.querySelector('.modal-close');
    const modalOverlay = modal?.querySelector('.modal-overlay');

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadImageLibrary();
        modal?.classList.add('active');
      });
    }

    if (uploadBtn) {
      uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        imageInput?.click();
      });
    }

    if (imageInput) {
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.handleArticleImageUpload(file);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearFeaturedImage();
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', () => modal?.classList.remove('active'));
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', () => modal?.classList.remove('active'));
    }
  }

  async loadImageLibrary() {
    const grid = document.getElementById('imageLibraryGrid');
    if (!grid) return;

    grid.innerHTML = '<p class="loading">Loading images...</p>';

    let allImages = [];

    // Load from localStorage galleries
    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    Object.entries(galleries).forEach(([collName, images]) => {
      images.forEach(img => {
        allImages.push({
          name: img.name,
          collection: collName,
          url: img.data,
          isLocal: true
        });
      });
    });

    // Try to load from GitHub
    try {
      const response = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images');
      const folders = await response.json();

      if (Array.isArray(folders)) {
        for (const folder of folders) {
          if (folder.type === 'dir' && folder.name !== 'homepage' && folder.name !== 'videos') {
            try {
              const collResponse = await fetch(folder.url);
              const files = await collResponse.json();
              if (Array.isArray(files)) {
                const images = files.filter(f => this.isImageFile(f.name));
                allImages = allImages.concat(images.map(img => ({
                  name: img.name,
                  collection: folder.name,
                  url: `images/${folder.name}/${img.name}`,
                  isLocal: false
                })));
              }
            } catch (e) { /* ignore */ }
          }
        }
      }
    } catch (e) {
      console.log('GitHub API unavailable');
    }

    if (allImages.length === 0) {
      grid.innerHTML = '<p class="loading">No images available. Upload images to a collection first.</p>';
      return;
    }

    grid.innerHTML = allImages.map(img => `
      <div class="image-library-item" data-url="${img.url}" data-name="${img.name}">
        <img src="${img.url}" alt="${this.escapeHtml(img.name)}" loading="lazy">
      </div>
    `).join('');

    grid.querySelectorAll('.image-library-item').forEach(item => {
      item.addEventListener('click', () => this.selectFeaturedImage(item));
    });
  }

  selectFeaturedImage(element) {
    const url = element.dataset.url;
    const name = element.dataset.name;

    document.querySelectorAll('.image-library-item').forEach(item => {
      item.classList.remove('selected');
    });
    element.classList.add('selected');

    const preview = document.getElementById('featuredImagePreview');
    if (preview) {
      preview.innerHTML = `<img src="${url}" alt="${this.escapeHtml(name)}">`;
    }

    const input = document.getElementById('articleThumbnail');
    if (input) input.value = url;

    const clearBtn = document.getElementById('clearImageBtn');
    if (clearBtn) clearBtn.style.display = 'block';

    document.getElementById('imageLibraryModal')?.classList.remove('active');
    Toast.success('Image selected');
  }

  handleArticleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;

      const preview = document.getElementById('featuredImagePreview');
      if (preview) {
        preview.innerHTML = `<img src="${data}" alt="${file.name}">`;
      }

      const input = document.getElementById('articleThumbnail');
      if (input) input.value = data;

      const clearBtn = document.getElementById('clearImageBtn');
      if (clearBtn) clearBtn.style.display = 'block';

      Toast.success('Image uploaded');
    };
    reader.readAsDataURL(file);
  }

  clearFeaturedImage() {
    const preview = document.getElementById('featuredImagePreview');
    if (preview) preview.innerHTML = '<p>No image selected</p>';

    const input = document.getElementById('articleThumbnail');
    if (input) input.value = '';

    const clearBtn = document.getElementById('clearImageBtn');
    if (clearBtn) clearBtn.style.display = 'none';
  }

  handleArticleSubmit(e) {
    e.preventDefault();

    const form = document.getElementById('articleForm');
    const editingId = form.dataset.editingId;

    const title = document.getElementById('articleTitle').value.trim();
    const author = document.getElementById('articleAuthor').value.trim();
    const body = document.getElementById('articleBody').value.trim();
    const category = document.getElementById('articleCategory').value.trim();
    const excerpt = document.getElementById('articleExcerpt').value.trim();
    const thumbnail = document.getElementById('articleThumbnail').value.trim();

    if (!title || !author || !body) {
      Toast.error('Please fill in title, author, and content');
      return;
    }

    const finalExcerpt = excerpt || body.substring(0, 150).replace(/[#*\[\]`]/g, '').trim() + '...';

    const article = {
      id: editingId || Date.now().toString(),
      title,
      category,
      author,
      excerpt: finalExcerpt,
      body,
      thumbnail,
      date: editingId ? (this.getArticleById(editingId)?.date || new Date().toISOString()) : new Date().toISOString(),
      published: document.getElementById('articlePublished').checked
    };

    let articles = JSON.parse(localStorage.getItem('articles') || '[]');

    if (editingId) {
      articles = articles.map(a => a.id === editingId ? article : a);
      Toast.success('Article updated!');
      this.cancelArticleEdit();
    } else {
      articles.push(article);
      Toast.success('Article created!');
    }

    localStorage.setItem('articles', JSON.stringify(articles));
    form.reset();

    const preview = document.getElementById('articlePreview');
    if (preview) {
      preview.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 32px;">Start typing to see preview...</p>';
    }

    this.clearFeaturedImage();
    this.loadArticlesList();
    this.loadStats();
  }

  loadArticlesList() {
    const articlesList = document.getElementById('articlesList');
    const articles = JSON.parse(localStorage.getItem('articles') || '[]');

    if (articles.length === 0) {
      articlesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p class="empty-state-title">No articles yet</p>
          <p class="empty-state-text">Create your first article using the form above</p>
        </div>
      `;
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
              <span class="badge ${article.published ? 'badge-success' : 'badge-warning'}">${article.published ? 'Published' : 'Draft'}</span>
            </div>
          </div>
          <div class="article-item-actions">
            <button class="article-btn article-btn-edit" data-id="${article.id}">Edit</button>
            <button class="article-btn article-btn-delete" data-id="${article.id}">Delete</button>
          </div>
        </div>
      `).join('');

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
    document.getElementById('articlePublished').checked = article.published !== false;

    if (article.thumbnail) {
      const preview = document.getElementById('featuredImagePreview');
      if (preview) preview.innerHTML = `<img src="${article.thumbnail}" alt="featured">`;

      const input = document.getElementById('articleThumbnail');
      if (input) input.value = article.thumbnail;

      const clearBtn = document.getElementById('clearImageBtn');
      if (clearBtn) clearBtn.style.display = 'block';
    }

    const form = document.getElementById('articleForm');
    form.dataset.editingId = id;

    document.getElementById('editorTitle').textContent = 'Edit Article';
    document.getElementById('submitBtn').textContent = 'Update Article';
    document.getElementById('cancelEditBtn').style.display = 'block';

    this.updateLivePreview();
    document.querySelector('.article-editor-left')?.scrollIntoView({ behavior: 'smooth' });
  }

  deleteArticle(id) {
    let articles = JSON.parse(localStorage.getItem('articles') || '[]');
    articles = articles.filter(a => a.id !== id);
    localStorage.setItem('articles', JSON.stringify(articles));
    this.loadArticlesList();
    this.loadStats();
    Toast.success('Article deleted');
  }

  cancelArticleEdit() {
    const form = document.getElementById('articleForm');
    form.reset();
    delete form.dataset.editingId;

    document.getElementById('editorTitle').textContent = 'Create New Article';
    document.getElementById('submitBtn').textContent = 'Create Article';
    document.getElementById('cancelEditBtn').style.display = 'none';

    const preview = document.getElementById('articlePreview');
    if (preview) {
      preview.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 32px;">Start typing to see preview...</p>';
    }

    this.clearFeaturedImage();
  }

  getArticleById(id) {
    const articles = JSON.parse(localStorage.getItem('articles') || '[]');
    return articles.find(a => a.id === id);
  }

  // ==================== GALLERY MANAGEMENT ====================

  setupGalleryManagement() {
    // Collection buttons
    const newCollectionBtn = document.getElementById('newCollectionBtn');
    const createCollectionBtn = document.getElementById('createCollectionBtn');
    const cancelCollectionBtn = document.getElementById('cancelCollectionBtn');
    const renameCollectionBtn = document.getElementById('renameCollectionBtn');
    const deleteCollectionBtn = document.getElementById('deleteCollectionBtn');
    const confirmRenameBtn = document.getElementById('confirmRenameBtn');
    const cancelRenameBtn = document.getElementById('cancelRenameBtn');

    // Image controls
    const sortGallery = document.getElementById('sortGallery');
    const selectAllImages = document.getElementById('selectAllImages');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

    // Upload
    const galleryUploadArea = document.getElementById('galleryUploadArea');
    const galleryInput = document.getElementById('galleryInput');

    // Event listeners
    if (newCollectionBtn) {
      newCollectionBtn.addEventListener('click', () => this.showNewCollectionForm());
    }

    if (createCollectionBtn) {
      createCollectionBtn.addEventListener('click', () => this.createCollection());
    }

    if (cancelCollectionBtn) {
      cancelCollectionBtn.addEventListener('click', () => this.hideNewCollectionForm());
    }

    if (renameCollectionBtn) {
      renameCollectionBtn.addEventListener('click', () => this.showRenameForm());
    }

    if (deleteCollectionBtn) {
      deleteCollectionBtn.addEventListener('click', () => this.deleteCurrentCollection());
    }

    if (confirmRenameBtn) {
      confirmRenameBtn.addEventListener('click', () => this.confirmRenameCollection());
    }

    if (cancelRenameBtn) {
      cancelRenameBtn.addEventListener('click', () => this.hideRenameForm());
    }

    if (sortGallery) {
      sortGallery.addEventListener('change', () => this.renderCurrentCollectionImages());
    }

    if (selectAllImages) {
      selectAllImages.addEventListener('change', (e) => this.toggleSelectAllImages(e.target.checked));
    }

    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedImages());
    }

    // Upload handling
    if (galleryUploadArea) {
      galleryUploadArea.addEventListener('click', () => galleryInput?.click());
      galleryUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        galleryUploadArea.classList.add('drag-over');
      });
      galleryUploadArea.addEventListener('dragleave', () => {
        galleryUploadArea.classList.remove('drag-over');
      });
      galleryUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        galleryUploadArea.classList.remove('drag-over');
        this.handleGalleryUpload(e.dataTransfer.files);
      });
    }

    if (galleryInput) {
      galleryInput.addEventListener('change', (e) => {
        this.handleGalleryUpload(e.target.files);
        e.target.value = '';
      });
    }

    // Enter key for collection name input
    document.getElementById('collectionNameInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.createCollection();
    });

    document.getElementById('renameInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.confirmRenameCollection();
    });

    // Initialize galleries if needed
    if (!localStorage.getItem('galleries')) {
      this.initializeSampleGalleries();
    }

    this.loadGalleryCollections();
  }

  loadGalleryCollections() {
    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
            
        // Ensure galleries are initialized
        if (!galleries || Object.keys(galleries).length === 0) {
            galleries = { 'Sample Collection': [] };
            localStorage.setItem('galleries', JSON.stringify(galleries));
        }
    this.renderCollectionsList(galleries);

    // Reset view
    document.getElementById('noCollectionSelected').style.display = 'flex';
    document.getElementById('collectionDetail').style.display = 'none';
    this.currentCollection = null;
  }

  renderCollectionsList(galleries) {
    const collectionsList = document.getElementById('collectionsList');
    const collectionNames = Object.keys(galleries).sort();

    if (collectionNames.length === 0) {
      collectionsList.innerHTML = `
        <div class="empty-state" style="padding: var(--space-xl) var(--space-sm);">
          <p class="empty-state-text" style="max-width: 200px;">No collections yet. Click "+ New" to create one.</p>
        </div>
      `;
      return;
    }

    collectionsList.innerHTML = collectionNames.map(name => `
      <div class="collection-item ${this.currentCollection === name ? 'active' : ''}" data-collection="${name}">
        <span class="collection-item-name">${this.escapeHtml(name)}</span>
        <span class="collection-item-count">${galleries[name].length}</span>
      </div>
    `).join('');

    document.querySelectorAll('.collection-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectCollection(item.dataset.collection);
      });
    });
  }

  selectCollection(name) {
    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');

    if (!galleries[name]) return;

    this.currentCollection = name;
    this.selectedImages.clear();

    // Update active state
    document.querySelectorAll('.collection-item').forEach(item => {
      item.classList.toggle('active', item.dataset.collection === name);
    });

    // Show collection detail
    document.getElementById('noCollectionSelected').style.display = 'none';
    document.getElementById('collectionDetail').style.display = 'block';

    // Update header
    document.getElementById('selectedCollectionName').textContent = name;
    document.getElementById('collectionImageCount').textContent = `${galleries[name].length} images`;

    // Reset form
    document.getElementById('renameForm').style.display = 'none';
    document.getElementById('sortGallery').value = 'name';
    document.getElementById('selectAllImages').checked = false;
    document.getElementById('deleteSelectedBtn').style.display = 'none';

    this.renderCurrentCollectionImages();
  }

  showNewCollectionForm() {
    const form = document.getElementById('newCollectionForm');
    const input = document.getElementById('collectionNameInput');
    form.style.display = 'block';
    input.value = '';
    input.focus();
  }

  hideNewCollectionForm() {
    document.getElementById('newCollectionForm').style.display = 'none';
    document.getElementById('collectionNameInput').value = '';
  }

  createCollection() {
    const input = document.getElementById('collectionNameInput');
    const name = input?.value.trim();

    if (!name) {
      Toast.error('Please enter a collection name');
      return;
    }

    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');

    if (galleries[name]) {
      Toast.error('Collection already exists');
      return;
    }

    galleries[name] = [];
    localStorage.setItem('galleries', JSON.stringify(galleries));
    Toast.success(`Collection "${name}" created`);
    this.hideNewCollectionForm();
    this.renderCollectionsList(galleries);
    this.selectCollection(name);
    this.loadStats();
  }

  showRenameForm() {
    const form = document.getElementById('renameForm');
    const input = document.getElementById('renameInput');
    form.style.display = 'block';
    input.value = this.currentCollection;
    input.focus();
    input.select();
  }

  hideRenameForm() {
    document.getElementById('renameForm').style.display = 'none';
  }

  confirmRenameCollection() {
    const input = document.getElementById('renameInput');
    const newName = input?.value.trim();

    if (!newName || newName === this.currentCollection) {
      this.hideRenameForm();
      return;
    }

    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');

    if (galleries[newName]) {
      Toast.error('Collection name already exists');
      return;
    }

    galleries[newName] = galleries[this.currentCollection];
    delete galleries[this.currentCollection];
    localStorage.setItem('galleries', JSON.stringify(galleries));

    Toast.success('Collection renamed');
    this.hideRenameForm();
    this.currentCollection = newName;
    this.renderCollectionsList(galleries);
    this.selectCollection(newName);
  }

  deleteCurrentCollection() {
    if (!this.currentCollection) return;

    if (!confirm(`Delete "${this.currentCollection}" and all its images? This cannot be undone.`)) {
      return;
    }

    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    delete galleries[this.currentCollection];
    localStorage.setItem('galleries', JSON.stringify(galleries));

    Toast.success('Collection deleted');
    this.currentCollection = null;
    this.renderCollectionsList(galleries);

    document.getElementById('noCollectionSelected').style.display = 'flex';
    document.getElementById('collectionDetail').style.display = 'none';
    this.loadStats();
  }

  handleGalleryUpload(files) {
    if (!this.currentCollection) {
      Toast.error('Please select a collection first');
      return;
    }

    const imageFiles = Array.from(files).filter(f => this.isImageFile(f.name));

    if (imageFiles.length === 0) {
      Toast.error('No valid image files selected');
      return;
    }

    let loaded = 0;

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadImageToCollection(file.name, e.target.result, file.size);
        loaded++;
        if (loaded === imageFiles.length) {
          Toast.success(`Uploaded ${imageFiles.length} image(s)`);
          this.renderCurrentCollectionImages();
          this.updateCollectionCount();
          this.loadStats();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  uploadImageToCollection(filename, imageData, size) {
    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');

    if (!galleries[this.currentCollection]) {
      galleries[this.currentCollection] = [];
    }

    galleries[this.currentCollection].push({
      id: Date.now() + Math.random(),
      name: filename,
      data: imageData,
      size: size || imageData.length,
      dateAdded: new Date().toISOString()
    });

    localStorage.setItem('galleries', JSON.stringify(galleries));
  }

  updateCollectionCount() {
    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    const count = galleries[this.currentCollection]?.length || 0;
    document.getElementById('collectionImageCount').textContent = `${count} images`;
    this.renderCollectionsList(galleries);
  }

  renderCurrentCollectionImages() {
    if (!this.currentCollection) return;

    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    const images = galleries[this.currentCollection] || [];

    let sortedImages = [...images];
    const sortMethod = document.getElementById('sortGallery')?.value || 'name';

    switch (sortMethod) {
      case 'name':
        sortedImages.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sortedImages.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'date':
        sortedImages.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        break;
      case 'date-old':
        sortedImages.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
        break;
      case 'size':
        sortedImages.sort((a, b) => b.size - a.size);
        break;
    }

    const grid = document.getElementById('collectionImagesGrid');
    if (!grid) return;

    if (images.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-state-icon">🖼️</div>
          <p class="empty-state-title">No images yet</p>
          <p class="empty-state-text">Drag & drop images or click the upload area above</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = sortedImages.map(image => `
      <div class="gallery-image-item ${this.selectedImages.has(image.id) ? 'selected' : ''}" data-image-id="${image.id}">
        <img src="${image.data}" alt="${this.escapeHtml(image.name)}" loading="lazy">
        <input type="checkbox" class="gallery-image-checkbox" data-image-id="${image.id}" ${this.selectedImages.has(image.id) ? 'checked' : ''}>
        <div class="gallery-image-info">
          <div class="gallery-image-name" title="${this.escapeHtml(image.name)}">${this.escapeHtml(image.name)}</div>
          <div class="gallery-image-meta">
            <span class="gallery-image-size">${this.formatFileSize(image.size)}</span>
          </div>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.gallery-image-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const id = parseFloat(checkbox.dataset.imageId);
        if (checkbox.checked) {
          this.selectedImages.add(id);
        } else {
          this.selectedImages.delete(id);
        }
        checkbox.closest('.gallery-image-item').classList.toggle('selected', checkbox.checked);
        this.updateDeleteSelectedButton();
      });
    });

    document.querySelectorAll('.gallery-image-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('gallery-image-checkbox')) return;
        const checkbox = item.querySelector('.gallery-image-checkbox');
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
    });
  }

  toggleSelectAllImages(checked) {
    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    const images = galleries[this.currentCollection] || [];

    this.selectedImages.clear();
    if (checked) {
      images.forEach(img => this.selectedImages.add(img.id));
    }

    document.querySelectorAll('.gallery-image-checkbox').forEach(checkbox => {
      checkbox.checked = checked;
      checkbox.closest('.gallery-image-item').classList.toggle('selected', checked);
    });

    this.updateDeleteSelectedButton();
  }

  updateDeleteSelectedButton() {
    const count = this.selectedImages.size;
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
      deleteBtn.style.display = count > 0 ? 'inline-flex' : 'none';
      deleteBtn.textContent = `Delete Selected (${count})`;
    }

    // Update select all checkbox
    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    const totalImages = galleries[this.currentCollection]?.length || 0;
    const selectAll = document.getElementById('selectAllImages');
    if (selectAll && totalImages > 0) {
      selectAll.checked = count === totalImages;
      selectAll.indeterminate = count > 0 && count < totalImages;
    }
  }

  deleteSelectedImages() {
    const count = this.selectedImages.size;
    if (count === 0) return;

    if (!confirm(`Delete ${count} image(s)? This cannot be undone.`)) {
      return;
    }

    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    galleries[this.currentCollection] = galleries[this.currentCollection].filter(
      img => !this.selectedImages.has(img.id)
    );

    localStorage.setItem('galleries', JSON.stringify(galleries));
    Toast.success(`Deleted ${count} image(s)`);

    this.selectedImages.clear();
    document.getElementById('selectAllImages').checked = false;
    this.renderCurrentCollectionImages();
    this.updateCollectionCount();
    this.updateDeleteSelectedButton();
    this.loadStats();
  }

  initializeSampleGalleries() {
    const sampleGalleries = {
      'Sample Collection': []
    };
    localStorage.setItem('galleries', JSON.stringify(sampleGalleries));
  }

  // ==================== VIDEO MANAGEMENT ====================

  setupVideoManagement() {
    const videoUploadArea = document.getElementById('videoUploadArea');
    const videoInput = document.getElementById('videoInput');

    if (videoUploadArea) {
      videoUploadArea.addEventListener('click', () => videoInput?.click());
      videoUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoUploadArea.classList.add('drag-over');
      });
      videoUploadArea.addEventListener('dragleave', () => {
        videoUploadArea.classList.remove('drag-over');
      });
      videoUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        videoUploadArea.classList.remove('drag-over');
        Toast.info('Videos must be uploaded to GitHub repository: images/videos/large/');
      });
    }

    if (videoInput) {
      videoInput.addEventListener('change', () => {
        Toast.info('Videos must be uploaded to GitHub repository: images/videos/large/');
      });
    }
  }

  async loadVideos() {
    const videoList = document.getElementById('videoList');
    videoList.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

    try {
      const response = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/videos/large');
      const files = await response.json();

      if (!Array.isArray(files)) {
        videoList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🎬</div>
            <p class="empty-state-title">No videos found</p>
            <p class="empty-state-text">Upload videos to images/videos/large/ in your GitHub repository</p>
          </div>
        `;
        return;
      }

      const videoFiles = files.filter(f => this.isVideoFile(f.name));

      if (videoFiles.length === 0) {
        videoList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🎬</div>
            <p class="empty-state-title">No videos in library</p>
            <p class="empty-state-text">Upload videos to images/videos/large/</p>
          </div>
        `;
        return;
      }

      videoList.innerHTML = videoFiles.map(file => `
        <div class="file-item">
          <div class="file-thumbnail" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px;">
            ▶
          </div>
          <div class="file-info">
            <div class="file-name">${this.escapeHtml(file.name)}</div>
            <div class="file-size">${this.formatFileSize(file.size)}</div>
            <div class="file-actions">
              <a href="images/videos/large/${file.name}" target="_blank" class="file-action-btn">Watch</a>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading videos:', error);
      videoList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <p class="empty-state-title">Error loading videos</p>
          <p class="empty-state-text">GitHub API may be unavailable. Try again later.</p>
        </div>
      `;
    }
  }

  // ==================== SETTINGS TAB ====================

  setupSettingsTab() {
    // Add export/import buttons dynamically
    const settingsTab = document.getElementById('settingsTab');
    if (!settingsTab) return;

        // Add navigation visibility section
    const navSection = document.createElement('div');
    navSection.className = 'settings-section';
    navSection.innerHTML = `
        <h3>Navigation Visibility</h3>
        <p>Control which menu items appear in the navigation bar.</p>
        <div style="margin-top: var(--space-md);">
            <label style="display: flex; align-items: center; gap: var(--space-sm); cursor: pointer;">
                <input type="checkbox" id="storeVisibilityToggle" style="width: 20px; height: 20px;">
                <span>Show Store in navigation</span>
            </label>
        </div>
    `;
    
    if (!settingsTab.querySelector('.settings-section')) {
        settingsTab.appendChild(navSection);
    } else {
        settingsTab.insertBefore(navSection, settingsTab.querySelector('.settings-section'));
    }
    
    // Load current store visibility setting
    const storeVisible = JSON.parse(localStorage.getItem('storeVisible') ?? 'true');
    document.getElementById('storeVisibilityToggle').checked = storeVisible;
    
    // Handle store visibility toggle
    document.getElementById('storeVisibilityToggle').addEventListener('change', (e) => {
        localStorage.setItem('storeVisible', JSON.stringify(e.target.checked));
        Toast.success(`Store ${e.target.checked ? 'shown' : 'hidden'} in navigation. Refresh to see changes.`);
    });


    // Add data management section
    const dataSection = document.createElement('div');
    dataSection.className = 'settings-section';
    dataSection.innerHTML = `
      <h3>Data Management</h3>
      <p>Export or import your admin panel data including articles, galleries, and page content.</p>
      <div class="form-actions" style="border-top: none; padding-top: var(--space-md);">
        <button type="button" id="exportDataBtn" class="btn-primary">Export All Data</button>
        <button type="button" id="importDataBtn" class="btn-secondary">Import Data</button>
        <button type="button" id="clearDataBtn" class="btn-danger btn-small">Clear All Data</button>
      </div>
      <input type="file" id="importDataInput" accept=".json" style="display: none;">
    `;

    // Insert after the first settings section
    const firstSection = settingsTab.querySelector('.settings-section');
    if (firstSection) {
      firstSection.parentNode.insertBefore(dataSection, firstSection.nextSibling);
    }

    // Add event listeners
    document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportData());
    document.getElementById('importDataBtn')?.addEventListener('click', () => {
      document.getElementById('importDataInput')?.click();
    });
    document.getElementById('importDataInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.importData(file);
    });
    document.getElementById('clearDataBtn')?.addEventListener('click', () => this.clearAllData());
  }

  exportData() {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      articles: JSON.parse(localStorage.getItem('articles') || '[]'),
      galleries: JSON.parse(localStorage.getItem('galleries') || '{}'),
      homepageContent: JSON.parse(localStorage.getItem('homepageContent') || '{}'),
      aboutContent: JSON.parse(localStorage.getItem('aboutContent') || '{}')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Toast.success('Data exported successfully');
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.version) {
          Toast.error('Invalid backup file format');
          return;
        }

        if (data.articles) localStorage.setItem('articles', JSON.stringify(data.articles));
        if (data.galleries) localStorage.setItem('galleries', JSON.stringify(data.galleries));
        if (data.homepageContent) localStorage.setItem('homepageContent', JSON.stringify(data.homepageContent));
        if (data.aboutContent) localStorage.setItem('aboutContent', JSON.stringify(data.aboutContent));

        Toast.success('Data imported successfully! Refreshing...');
        setTimeout(() => location.reload(), 1500);
      } catch (error) {
        Toast.error('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
  }

  clearAllData() {
    if (!confirm('This will delete ALL your data including articles, galleries, and page content. This cannot be undone. Continue?')) {
      return;
    }

    if (!confirm('Are you absolutely sure? Type "DELETE" mentally and click OK.')) {
      return;
    }

    localStorage.removeItem('articles');
    localStorage.removeItem('galleries');
    localStorage.removeItem('homepageContent');
    localStorage.removeItem('aboutContent');
    localStorage.removeItem('uploadedImages');

    Toast.success('All data cleared. Refreshing...');
    setTimeout(() => location.reload(), 1500);
  }

  // ==================== UTILITY FUNCTIONS ====================

  parseMarkdown(text) {
    if (!text) return '';

    let html = this.escapeHtml(text);

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Blockquotes
    html = html.replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>');

    // Lists
    html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Paragraphs
    html = html.split('\n\n').map(para => {
      if (!para.match(/^<[^>]+>/) && para.trim()) {
        return `<p>${para}</p>`;
      }
      return para;
    }).join('\n');

    return html;
  }

  isVideoFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'flv', 'wmv'].includes(ext);
  }

  isImageFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext);
  }

  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
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
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ==================== SIDEBAR TOGGLE & PIN FUNCTIONALITY ====================

function initSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const pinBtn = document.getElementById('sidebarPin');
    
    if (!sidebar || !toggleBtn || !pinBtn) return;
    
    // Load saved state from localStorage
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const isPinned = localStorage.getItem('sidebarPinned') === 'true';
    
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
    }
    
    if (isPinned) {
        sidebar.classList.add('pinned');
        pinBtn.classList.add('pinned');
    }
    
    // Toggle collapse functionality
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        const collapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', collapsed);
    });
    
    // Toggle pin functionality
    pinBtn.addEventListener('click', () => {
        sidebar.classList.toggle('pinned');
        pinBtn.classList.toggle('pinned');
        const pinned = sidebar.classList.contains('pinned');
        localStorage.setItem('sidebarPinned', pinned);
    });
    
    // Update navigation to use new class names (replace old .admin-tab-btn logic)
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const tab = this.getAttribute('data-tab');
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const activeContent = document.getElementById(tab + 'Tab');
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
}


// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.adminPanel = new AdminPanel();

      // Initialize sidebar toggle and pin functionality
    initSidebar();

});
