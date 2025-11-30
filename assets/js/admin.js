/**
 * Admin Panel - Comprehensive Implementation
 * Full article editor with live preview, reading time, image management
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

  // ==================== ADVANCED ARTICLE EDITOR ====================

  setupArticleEditor() {
    const form = document.getElementById('articleForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    if (form) {
      form.addEventListener('submit', (e) => this.handleArticleSubmit(e));
      if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => this.cancelArticleEdit());
      }
    }

    // Setup markdown toolbar
    this.setupMarkdownToolbar();

    // Setup live preview
    this.setupLivePreview();

    // Setup featured image selector
    this.setupFeaturedImageSelector();

    // Load articles list
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
        result = before + `` + `${selectedText || 'code'}` + `` + after;
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
    const title = document.getElementById('articleTitle').value;
    const body = document.getElementById('articleBody').value;
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

    // Update word count and reading time
    this.updateEditorStats();
  }

  updateEditorStats() {
    const body = document.getElementById('articleBody').value;
    const wordCount = body.trim().split(/\s+/).filter(w => w).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

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
    const modalClose = modal ? modal.querySelector('.modal-close') : null;

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadImageLibrary();
        if (modal) modal.classList.add('active');
      });
    }

    if (uploadBtn) {
      uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (imageInput) imageInput.click();
      });
    }

    if (imageInput) {
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.handleImageUpload(file);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearFeaturedImage();
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', () => {
        if (modal) modal.classList.remove('active');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  }

  async loadImageLibrary() {
    const grid = document.getElementById('imageLibraryGrid');
    if (!grid) return;

    grid.innerHTML = '<p class="loading">Loading images...</p>';

    try {
      const response = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images/gallery');
      const folders = await response.json();

      if (!Array.isArray(folders)) {
        grid.innerHTML = '<p class="loading">No images found</p>';
        return;
      }

      let allImages = [];

      for (const folder of folders) {
        if (folder.type === 'dir') {
          try {
            const collResponse = await fetch(folder.url);
            const files = await collResponse.json();
            if (Array.isArray(files)) {
              const images = files.filter(f => this.isImageFile(f.name));
              allImages = allImages.concat(images.map(img => ({
                name: img.name,
                collection: folder.name,
                url: `images/gallery/${folder.name}/${img.name}`
              })));
            }
          } catch (e) {
            console.error('Error loading folder:', folder.name);
          }
        }
      }

      if (allImages.length === 0) {
        grid.innerHTML = '<p class="loading">No images available</p>';
        return;
      }

      grid.innerHTML = allImages.map(img => `
        <div class="image-library-item" data-url="${img.url}" data-name="${img.name}">
          <img src="${img.url}" alt="${img.name}" loading="lazy">
        </div>
      `).join('');

      grid.querySelectorAll('.image-library-item').forEach(item => {
        item.addEventListener('click', () => this.selectFeaturedImage(item));
      });
    } catch (error) {
      console.error('Error loading image library:', error);
      grid.innerHTML = '<p class="loading">Error loading images</p>';
    }
  }

  selectFeaturedImage(element) {
    const url = element.dataset.url;
    const name = element.dataset.name;

    // Remove previous selection
    document.querySelectorAll('.image-library-item').forEach(item => {
      item.classList.remove('selected');
    });

    // Select this item
    element.classList.add('selected');

    // Update featured image preview
    const preview = document.getElementById('featuredImagePreview');
    if (preview) {
      preview.innerHTML = `<img src="${url}" alt="${name}">`;
    }

    // Store in hidden input
    const input = document.getElementById('articleThumbnail');
    if (input) {
      input.value = url;
    }

    // Show clear button
    const clearBtn = document.getElementById('clearImageBtn');
    if (clearBtn) {
      clearBtn.style.display = 'block';
    }

    // Close modal
    const modal = document.getElementById('imageLibraryModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const imageName = `article-img-${Date.now()}.${file.name.split('.').pop()}`;

      // Store in localStorage (base64)
      let storedImages = JSON.parse(localStorage.getItem('uploadedImages') || '{}');
      storedImages[imageName] = data;
      localStorage.setItem('uploadedImages', JSON.stringify(storedImages));

      // Set as featured image
      const preview = document.getElementById('featuredImagePreview');
      if (preview) {
        preview.innerHTML = `<img src="${data}" alt="${imageName}">`;
      }

      const input = document.getElementById('articleThumbnail');
      if (input) {
        input.value = data;
      }

      const clearBtn = document.getElementById('clearImageBtn');
      if (clearBtn) {
        clearBtn.style.display = 'block';
      }

      this.showNotification('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  }

  clearFeaturedImage() {
    const preview = document.getElementById('featuredImagePreview');
    if (preview) {
      preview.innerHTML = '<p>No image selected</p>';
    }

    const input = document.getElementById('articleThumbnail');
    if (input) {
      input.value = '';
    }

    const clearBtn = document.getElementById('clearImageBtn');
    if (clearBtn) {
      clearBtn.style.display = 'none';
    }
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
      this.showNotification('Please fill in title, author, and content', 'error');
      return;
    }

    // Auto-generate excerpt if not provided
    const finalExcerpt = excerpt || body.substring(0, 150).replace(/[#*\[\]`]/g, '').trim() + '...';

    const article = {
      id: editingId || Date.now().toString(),
      title,
      category,
      author,
      excerpt: finalExcerpt,
      body,
      thumbnail,
      date: editingId ? this.getArticleById(editingId).date : new Date().toISOString(),
      published: document.getElementById('articlePublished').checked
    };

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
    document.getElementById('articlePublished').checked = article.published !== false;

    // Set featured image
    if (article.thumbnail) {
      const preview = document.getElementById('featuredImagePreview');
      if (preview) {
        preview.innerHTML = `<img src="${article.thumbnail}" alt="featured">`;
      }

      const input = document.getElementById('articleThumbnail');
      if (input) {
        input.value = article.thumbnail;
      }

      const clearBtn = document.getElementById('clearImageBtn');
      if (clearBtn) {
        clearBtn.style.display = 'block';
      }
    }

    const form = document.getElementById('articleForm');
    form.dataset.editingId = id;
    const editorTitle = document.getElementById('editorTitle');
    const submitBtn = document.getElementById('submitBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    if (editorTitle) editorTitle.textContent = 'Edit Article';
    if (submitBtn) submitBtn.textContent = 'Update Article';
    if (cancelEditBtn) cancelEditBtn.style.display = 'block';

    this.updateLivePreview();
    const editorLeft = document.querySelector('.article-editor-left');
    if (editorLeft) {
      editorLeft.scrollIntoView({ behavior: 'smooth' });
    }
  }

  deleteArticle(id) {
    let articles = JSON.parse(localStorage.getItem('articles') || '[]');
    articles = articles.filter(a => a.id !== id);
    localStorage.setItem('articles', JSON.stringify(articles));
    this.loadArticlesList();
    this.loadStats();
    this.showNotification('Article deleted successfully!');
  }

  cancelArticleEdit() {
    const form = document.getElementById('articleForm');
    form.reset();
    delete form.dataset.editingId;

    const editorTitle = document.getElementById('editorTitle');
    const submitBtn = document.getElementById('submitBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    if (editorTitle) editorTitle.textContent = 'Create New Article';
    if (submitBtn) submitBtn.textContent = 'Create Article';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';

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
      `${files.length} file${files.length !== 1 ? 's' : ''} selected. Push to GitHub:\n\nVideos: images/videos/large/\nGallery: images/gallery/[collection-name]/`,
      'info'
    );
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
    html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');

    // Lists
    html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');

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
