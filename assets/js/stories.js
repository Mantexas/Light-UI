/**
 * Stories / Articles Display
 * Loads and displays articles stored in localStorage
 */

class StoriesPage {
  constructor() {
    this.storiesGrid = document.getElementById('storiesGrid');
    this.emptyState = document.getElementById('emptyState');
    this.articleModal = document.getElementById('articleModal');
    this.modalClose = document.querySelector('.modal-close');
    this.articles = [];

    this.init();
  }

  init() {
    this.loadArticles();
    this.setupEventListeners();
  }

  /**
   * Load articles from localStorage
   */
  loadArticles() {
    const stored = localStorage.getItem('articles');
    this.articles = stored ? JSON.parse(stored) : [];

    if (this.articles.length === 0) {
      this.storiesGrid.style.display = 'none';
      this.emptyState.style.display = 'flex';
      this.emptyState.innerHTML = `
        <p>Coming Soon</p>
        <p style="font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: var(--font-weight-light); max-width: 500px; line-height: var(--line-height-relaxed);">We're crafting thoughtful stories about photography, creative process, and art. Check back soon for our first article.</p>
      `;
      return;
    }

    this.storiesGrid.style.display = 'grid';
    this.emptyState.style.display = 'none';
    this.renderArticles();
  }

  /**
   * Render article cards in grid
   */
  renderArticles() {
    this.storiesGrid.innerHTML = this.articles
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((article, index) => `
        <article class="article-card" data-index="${index}">
          <div class="article-thumbnail">
            ${article.thumbnail ? `<img src="${article.thumbnail}" alt="${article.title}" onerror="this.style.display='none';">` : '📝'}
          </div>
          <div class="article-content">
            ${article.category ? `<span class="article-tag">${article.category}</span>` : ''}
            <h2 class="article-title">${this.escapeHtml(article.title)}</h2>
            <p class="article-excerpt">${this.escapeHtml(article.excerpt || article.body.substring(0, 150))}</p>
            <div class="article-meta">
              <span>${this.formatDate(article.date)}</span>
              <span>by ${this.escapeHtml(article.author || 'Anonymous')}</span>
            </div>
          </div>
        </article>
      `).join('');

    // Add click handlers to cards
    document.querySelectorAll('.article-card').forEach(card => {
      card.addEventListener('click', () => {
        const index = card.dataset.index;
        this.openArticle(this.articles[index]);
      });
    });
  }

  /**
   * Open article in modal
   */
  openArticle(article) {
    document.getElementById('articleTitle').textContent = article.title;
    document.getElementById('articleDate').textContent = `Published ${this.formatDate(article.date)}`;
    document.getElementById('articleAuthor').textContent = `By ${article.author || 'Anonymous'}`;
    document.getElementById('articleBody').innerHTML = this.parseMarkdown(article.body);

    this.articleModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close modal
   */
  closeModal() {
    this.articleModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Simple markdown parser for article body
   */
  parseMarkdown(text) {
    if (!text) return '';

    let html = this.escapeHtml(text);

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

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

    // Numbered lists
    html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');

    // Paragraphs
    html = html.split('\n\n').map(para => {
      if (!para.match(/^<[^>]+>/) && para.trim()) {
        return `<p>${para}</p>`;
      }
      return para;
    }).join('\n');

    return html;
  }

  /**
   * Format date to readable format
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.modalClose.addEventListener('click', () => this.closeModal());

    // Close on outside click
    this.articleModal.addEventListener('click', (e) => {
      if (e.target === this.articleModal) {
        this.closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.articleModal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new StoriesPage();
});
