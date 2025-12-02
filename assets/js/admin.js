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
      this.setupHomepageEditor();
      this.setupAboutEditor();
      this.setupArticleEditor();
      this.setupGalleryManagement();
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
      this.setupHomepageEditor();
      this.setupAboutEditor();
      this.setupArticleEditor();
      this.setupGalleryManagement();
      this.setupUploadHandlers();
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

      // Try to load gallery collections from images/
      try {
        const galleryResponse = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images');
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

  // ==================== HOMEPAGE EDITOR ====================

  setupHomepageEditor() {
    const form = document.getElementById('homepageForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleHomepageSubmit(e));
      form.addEventListener('reset', (e) => this.handleHomepageReset(e));
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

    document.getElementById('heroTitle').value = content.heroTitle;
    document.getElementById('heroDescription').value = content.heroDescription;
    document.getElementById('ctaButtonText').value = content.ctaButtonText;
    document.getElementById('ctaButtonLink').value = content.ctaButtonLink;
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

    // Validation
    if (!content.heroTitle || !content.heroDescription || !content.ctaButtonText || !content.ctaButtonLink) {
      this.showNotification('All fields are required!', 'error');
      return;
    }

    if (!content.ctaButtonLink.match(/\.(html|htm)$/)) {
      this.showNotification('CTA link must be an HTML file (e.g., color.html)', 'error');
      return;
    }

    localStorage.setItem('homepageContent', JSON.stringify(content));
    this.showNotification('Homepage content saved successfully! Refresh the homepage to see changes.');
  }

  handleHomepageReset(e) {
    e.preventDefault();
    localStorage.removeItem('homepageContent');
    this.loadHomepageContent();
    this.showNotification('Homepage content reset to defaults.');
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
      const response = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images');
      const folders = await response.json();

      if (!Array.isArray(folders)) {
        grid.innerHTML = '<p class="loading">No images found</p>';
        return;
      }

      let allImages = [];

      for (const folder of folders) {
        if (folder.type === 'dir' && folder.name !== 'homepage') {
          try {
            const collResponse = await fetch(folder.url);
            const files = await collResponse.json();
            if (Array.isArray(files)) {
              const images = files.filter(f => this.isImageFile(f.name));
              allImages = allImages.concat(images.map(img => ({
                name: img.name,
                collection: folder.name,
                url: `images/${folder.name}/${img.name}`
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

  // ==================== GALLERY MANAGEMENT ====================

  setupGalleryManagement() {
    // Initialize on first load
    if (localStorage.getItem('galleries') === null) {
      this.initializeSampleGalleries();
    }

    // Load initial gallery data
    this.loadGalleries();

    // Setup event listeners
    const newCollectionBtn = document.getElementById('newCollectionBtn');
    const createCollectionBtn = document.getElementById('createCollectionBtn');
    const cancelCollectionBtn = document.getElementById('cancelCollectionBtn');
    const galleryInput = document.getElementById('galleryInput');
    const galleryUploadArea = document.getElementById('galleryUploadArea');
    const sortGallery = document.getElementById('sortGallery');
    const selectAllImages = document.getElementById('selectAllImages');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const renameCollectionBtn = document.getElementById('renameCollectionBtn');
    const confirmRenameBtn = document.getElementById('confirmRenameBtn');
    const cancelRenameBtn = document.getElementById('cancelRenameBtn');
    const deleteCollectionBtn = document.getElementById('deleteCollectionBtn');

    if (newCollectionBtn) {
      newCollectionBtn.addEventListener('click', () => this.showNewCollectionForm());
    }
    if (createCollectionBtn) {
      createCollectionBtn.addEventListener('click', () => this.createCollection());
    }
    if (cancelCollectionBtn) {
      cancelCollectionBtn.addEventListener('click', () => this.hideNewCollectionForm());
    }

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
        if (e.dataTransfer.files.length > 0) {
          this.handleGalleryUpload(e.dataTransfer.files);
        }
      });
    }

    if (galleryInput) {
      galleryInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleGalleryUpload(e.target.files);
        }
      });
    }

    if (sortGallery) {
      sortGallery.addEventListener('change', () => this.renderCurrentCollectionImages());
    }

    if (selectAllImages) {
      selectAllImages.addEventListener('change', (e) => {
        document.querySelectorAll('.gallery-image-checkbox').forEach(checkbox => {
          checkbox.checked = e.target.checked;
        });
        this.updateDeleteSelectedButton();
      });
    }

    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedImages());
    }

    if (renameCollectionBtn) {
      renameCollectionBtn.addEventListener('click', () => this.showRenameForm());
    }

    if (confirmRenameBtn) {
      confirmRenameBtn.addEventListener('click', () => this.confirmRenameCollection());
    }

    if (cancelRenameBtn) {
      cancelRenameBtn.addEventListener('click', () => this.hideRenameForm());
    }

    if (deleteCollectionBtn) {
      deleteCollectionBtn.addEventListener('click', () => this.deleteCurrentCollection());
    }
  }

  loadGalleries() {
    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    this.currentCollection = null;
    this.currentSortMethod = 'name';
    this.renderCollectionsList(galleries);
  }

  renderCollectionsList(galleries) {
    const collectionsList = document.getElementById('collectionsList');
    const collectionNames = Object.keys(galleries).sort();

    if (collectionNames.length === 0) {
      collectionsList.innerHTML = '<p class="loading">No collections yet. Create one to get started!</p>';
      return;
    }

    collectionsList.innerHTML = collectionNames.map(name => `
      <div class="collection-item" data-collection="${name}">
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
    this.currentSortMethod = 'name';

    // Update active state
    document.querySelectorAll('.collection-item').forEach(item => {
      item.classList.toggle('active', item.dataset.collection === name);
    });

    // Show collection detail
    const noCollection = document.getElementById('noCollectionSelected');
    const collectionDetail = document.getElementById('collectionDetail');
    if (noCollection) noCollection.style.display = 'none';
    if (collectionDetail) collectionDetail.style.display = 'block';

    // Update header
    const collectionName = document.getElementById('selectedCollectionName');
    const imageCount = document.getElementById('collectionImageCount');
    if (collectionName) collectionName.textContent = name;
    if (imageCount) imageCount.textContent = `${galleries[name].length} images`;

    // Reset form
    const renameForm = document.getElementById('renameForm');
    if (renameForm) renameForm.style.display = 'none';

    const sortGallery = document.getElementById('sortGallery');
    if (sortGallery) sortGallery.value = 'name';

    // Render images
    this.renderCurrentCollectionImages();
  }

  showNewCollectionForm() {
    const form = document.getElementById('newCollectionForm');
    const input = document.getElementById('collectionNameInput');
    if (form) {
      form.style.display = 'block';
      if (input) input.focus();
    }
  }

  hideNewCollectionForm() {
    const form = document.getElementById('newCollectionForm');
    const input = document.getElementById('collectionNameInput');
    if (form) form.style.display = 'none';
    if (input) input.value = '';
  }

  createCollection() {
    const input = document.getElementById('collectionNameInput');
    const name = input?.value.trim();

    if (!name) {
      this.showNotification('Please enter a collection name', 'error');
      return;
    }

    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');

    if (galleries[name]) {
      this.showNotification('Collection already exists', 'error');
      return;
    }

    galleries[name] = [];
    localStorage.setItem('galleries', JSON.stringify(galleries));
    this.showNotification('Collection created!');
    this.hideNewCollectionForm();
    this.loadGalleries();
    this.selectCollection(name);
  }

  showRenameForm() {
    const form = document.getElementById('renameForm');
    const input = document.getElementById('renameInput');
    if (form) {
      form.style.display = 'block';
      if (input) {
        input.value = this.currentCollection;
        input.focus();
        input.select();
      }
    }
  }

  hideRenameForm() {
    const form = document.getElementById('renameForm');
    if (form) form.style.display = 'none';
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
      this.showNotification('Collection name already exists', 'error');
      return;
    }

    galleries[newName] = galleries[this.currentCollection];
    delete galleries[this.currentCollection];
    localStorage.setItem('galleries', JSON.stringify(galleries));

    this.showNotification('Collection renamed!');
    this.hideRenameForm();
    this.loadGalleries();
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

    this.showNotification('Collection deleted!');
    this.currentCollection = null;
    this.loadGalleries();

    const noCollection = document.getElementById('noCollectionSelected');
    const collectionDetail = document.getElementById('collectionDetail');
    if (noCollection) noCollection.style.display = 'flex';
    if (collectionDetail) collectionDetail.style.display = 'none';
  }

  handleGalleryUpload(files) {
    if (!this.currentCollection) {
      this.showNotification('Please select a collection first', 'error');
      return;
    }

    const imageFiles = Array.from(files).filter(f => this.isImageFile(f.name));

    if (imageFiles.length === 0) {
      this.showNotification('No image files selected', 'error');
      return;
    }

    let loaded = 0;

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadImageToCollection(file.name, e.target.result);
        loaded++;
        if (loaded === imageFiles.length) {
          this.showNotification(`Uploaded ${imageFiles.length} image(s)`);
          this.renderCurrentCollectionImages();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  uploadImageToCollection(filename, imageData) {
    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');

    if (!galleries[this.currentCollection]) {
      galleries[this.currentCollection] = [];
    }

    galleries[this.currentCollection].push({
      id: Date.now() + Math.random(),
      name: filename,
      data: imageData,
      size: Math.round(imageData.length),
      dateAdded: new Date().toISOString()
    });

    localStorage.setItem('galleries', JSON.stringify(galleries));
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
      grid.innerHTML = '<p class="loading" style="grid-column: 1/-1;">No images yet. Upload some to get started!</p>';
      return;
    }

    grid.innerHTML = sortedImages.map(image => `
      <div class="gallery-image-item" data-image-id="${image.id}">
        <img src="${image.data}" alt="${image.name}">
        <input type="checkbox" class="gallery-image-checkbox" data-image-id="${image.id}">
        <div class="gallery-image-info">
          <div class="gallery-image-name">${this.escapeHtml(image.name)}</div>
          <div style="font-size: 10px; margin-top: 4px;">${this.formatFileSize(image.size)}</div>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.gallery-image-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateDeleteSelectedButton());
    });

    document.querySelectorAll('.gallery-image-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('gallery-image-checkbox')) {
          const checkbox = item.querySelector('.gallery-image-checkbox');
          checkbox.checked = !checkbox.checked;
          this.updateDeleteSelectedButton();
        }
      });
    });
  }

  updateDeleteSelectedButton() {
    const selectedCount = document.querySelectorAll('.gallery-image-checkbox:checked').length;
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
      deleteBtn.style.display = selectedCount > 0 ? 'block' : 'none';
      deleteBtn.textContent = `Delete Selected (${selectedCount})`;
    }
  }

  deleteSelectedImages() {
    const selectedIds = Array.from(document.querySelectorAll('.gallery-image-checkbox:checked'))
      .map(cb => cb.dataset.imageId);

    if (selectedIds.length === 0) return;

    if (!confirm(`Delete ${selectedIds.length} image(s)? This cannot be undone.`)) {
      return;
    }

    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    galleries[this.currentCollection] = galleries[this.currentCollection].filter(
      img => !selectedIds.includes(img.id.toString())
    );

    localStorage.setItem('galleries', JSON.stringify(galleries));
    this.showNotification(`Deleted ${selectedIds.length} image(s)`);
    this.renderCurrentCollectionImages();

    const selectAll = document.getElementById('selectAllImages');
    if (selectAll) selectAll.checked = false;
  }

  deleteImage(imageId) {
    if (!confirm('Delete this image? This cannot be undone.')) {
      return;
    }

    const galleries = JSON.parse(localStorage.getItem('galleries') || '{}');
    galleries[this.currentCollection] = galleries[this.currentCollection].filter(
      img => img.id !== imageId
    );

    localStorage.setItem('galleries', JSON.stringify(galleries));
    this.showNotification('Image deleted');
    this.renderCurrentCollectionImages();
  }

  initializeSampleGalleries() {
    // Create sample galleries with demo images
    const sampleGalleries = {
      'Vilnius': [
        {
          id: 1,
          name: 'vilnius-cathedral.jpg',
          data: this.generateSampleImage('#1a1a1a', 'Vilnius\nCathedral'),
          size: 245000,
          dateAdded: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          name: 'vilnius-street.jpg',
          data: this.generateSampleImage('#2d2d2d', 'Street\nLife'),
          size: 189000,
          dateAdded: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          name: 'vilnius-sunset.jpg',
          data: this.generateSampleImage('#4a4a4a', 'Golden\nHour'),
          size: 312000,
          dateAdded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      'Landscapes': [
        {
          id: 4,
          name: 'mountain-peaks.jpg',
          data: this.generateSampleImage('#3d5a3d', 'Mountain\nPeaks'),
          size: 267000,
          dateAdded: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 5,
          name: 'forest-dawn.jpg',
          data: this.generateSampleImage('#1a3a1a', 'Forest\nDawn'),
          size: 198000,
          dateAdded: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 6,
          name: 'coastal-view.jpg',
          data: this.generateSampleImage('#1a3a5a', 'Coastal\nView'),
          size: 289000,
          dateAdded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      'Portrait': [
        {
          id: 7,
          name: 'studio-portrait.jpg',
          data: this.generateSampleImage('#5a5a3d', 'Studio\nPortrait'),
          size: 156000,
          dateAdded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 8,
          name: 'natural-light.jpg',
          data: this.generateSampleImage('#5a4a2d', 'Natural\nLight'),
          size: 203000,
          dateAdded: new Date().toISOString()
        }
      ]
    };

    localStorage.setItem('galleries', JSON.stringify(sampleGalleries));
  }

  generateSampleImage(bgColor, text) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 400, 300);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(Math.random() * 400, Math.random() * 300, Math.random() * 100, Math.random() * 100);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = text.split('\n');
    const lineHeight = 30;
    const startY = 150 - (lines.length * lineHeight) / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, 200, startY + i * lineHeight);
    });

    return canvas.toDataURL('image/jpeg', 0.9);
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
      const response = await fetch('https://api.github.com/repos/Mantexas/Light-UI/contents/images');
      const folders = await response.json();

      if (!Array.isArray(folders)) {
        galleryList.innerHTML = '<p class="loading">No collections found.</p>';
        return;
      }

      const collections = folders.filter(f => f.type === 'dir' && f.name !== 'homepage');

      if (collections.length === 0) {
        galleryList.innerHTML = '<p class="loading">No collections. Create folders in images/</p>';
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
            <img src="images/${file.collection}/${file.name}" alt="${file.name}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${this.formatFileSize(file.size)}</div>
            <div class="file-collection">${file.collection}</div>
            <div class="file-actions">
              <a href="images/${file.collection}/${file.name}" target="_blank" class="file-action-btn">View</a>
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
      `${files.length} file${files.length !== 1 ? 's' : ''} selected. Push to GitHub:\n\nGallery: images/[collection-name]/\nHomepage: images/homepage/`,
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
