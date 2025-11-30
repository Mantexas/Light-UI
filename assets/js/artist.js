/**
 * About / Artist Page
 * Loads and displays about content from localStorage
 */

class AboutPage {
  constructor() {
    this.aboutTextMain = document.getElementById('aboutTextMain');
    this.aboutImage = document.getElementById('aboutImage');
    this.aboutTextBottom = document.getElementById('aboutTextBottom');

    this.init();
  }

  init() {
    this.loadAboutContent();
  }

  /**
   * Load about content from localStorage
   */
  loadAboutContent() {
    const stored = localStorage.getItem('aboutContent');

    if (stored) {
      const content = JSON.parse(stored);
      this.displayContent(content);
    } else {
      // Show default content
      this.displayDefaultContent();
    }
  }

  /**
   * Display loaded content
   */
  displayContent(content) {
    // Display main text (left side)
    if (content.textMain) {
      this.aboutTextMain.innerHTML = this.parseMarkdown(content.textMain);
    }

    // Display image (right side)
    if (content.imageUrl) {
      this.aboutImage.src = content.imageUrl;
      this.aboutImage.alt = content.imageName || 'Artist';
    }

    // Display bottom text (full width)
    if (content.textBottom) {
      this.aboutTextBottom.innerHTML = this.parseMarkdown(content.textBottom);
    }
  }

  /**
   * Display default content
   */
  displayDefaultContent() {
    this.aboutTextMain.innerHTML = `
      <p>Welcome to my artistic journey. I am a fine art photographer dedicated to capturing the essence of nature and light.</p>
      <p>My work explores the interplay between composition, light, and moment - seeking to create images that evoke emotion and contemplation.</p>
    `;

    this.aboutImage.src = 'images/large/default-artist.jpg';
    this.aboutImage.alt = 'Artist Portrait';

    this.aboutTextBottom.innerHTML = `
      <p>Each photograph is meticulously crafted and printed on exceptional materials to ensure longevity and visual impact.</p>
      <p>Thank you for viewing my work.</p>
    `;
  }

  /**
   * Simple markdown parser
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
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new AboutPage();
});
