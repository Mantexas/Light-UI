/**
 * Navigation Visibility Controller
 * Handles hiding/showing navigation items based on admin settings
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if store should be visible
    const storeVisible = JSON.parse(localStorage.getItem('storeVisible') ?? 'true');
    
    if (!storeVisible) {
        // Find and hide the store link in navigation
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            if (link.href && link.href.includes('store.html')) {
                link.parentElement.style.display = 'none';
            }
        });
    }
});
