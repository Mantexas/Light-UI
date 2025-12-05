// ==========================================
// HOME PAGE JAVASCRIPT
// ==========================================

// Load homepage content from localStorage
function loadHomepageContent() {
    const stored = localStorage.getItem('homepageContent');

    if (!stored) return; // Use defaults from HTML

    try {
        const content = JSON.parse(stored);

        // Update hero title
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle && content.heroTitle) {
            heroTitle.textContent = content.heroTitle;
        }

        // Update hero description
        const heroDescription = document.querySelector('.hero-description');
        if (heroDescription && content.heroDescription) {
            heroDescription.textContent = content.heroDescription;
        }

        // Update CTA button
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            if (content.ctaButtonText) {
                ctaButton.textContent = content.ctaButtonText;
            }
            if (content.ctaButtonLink) {
                ctaButton.href = content.ctaButtonLink;
            }
        }
    } catch (error) {
        console.error('Error loading homepage content:', error);
    }
}

// Load hero gallery images from GitHub API
async function loadHeroGallery() {
    const heroGallery = document.getElementById('heroGallery');

    if (!heroGallery) return;

    try {
        const apiUrl = `https://api.github.com/repos/Mantexas/Light-UI/contents/images/homepage`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            heroGallery.innerHTML = '<p style="color: #666; text-align: center;">Create an "images/homepage" folder and add images to display them here.</p>';
            return;
        }

        const files = await response.json();

        // Filter for image files
        const imageFiles = files.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        });

        if (imageFiles.length === 0) {
            heroGallery.innerHTML = '<p style="color: #666; text-align: center;">No images found in images/homepage folder.</p>';
            return;
        }

        // Show first 6 images in hero gallery
        const imagesToShow = imageFiles.slice(0, 6);

        imagesToShow.forEach(file => {
            const img = document.createElement('img');
            img.src = `images/homepage/${file.name}`;
            img.alt = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
            img.loading = 'lazy';
            heroGallery.appendChild(img);
        });

    } catch (error) {
        console.error('Error loading hero gallery:', error);
        heroGallery.innerHTML = '<p style="color: #666; text-align: center;">Create an "images/homepage" folder and add images to display them here.</p>';
    }
}

// Fade in animations on scroll
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.fade-in').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHomepageContent();
    loadHeroGallery();
    initAnimations();
});
