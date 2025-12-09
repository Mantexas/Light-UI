/**
 * Animated Cat Loader
 * Displays a cute animated cat that changes behavior based on page activity
 */

class CatLoader {
    constructor() {
        this.catElement = null;
        this.states = ['loading', 'idle', 'sleeping'];
        this.currentState = 'idle';
        this.inactivityTimer = null;
        this.init();
    }

    init() {
        // Create cat loader element
        this.catElement = document.createElement('div');
        this.catElement.className = 'cat-loader idle';
        this.catElement.innerHTML = '🐱';
        document.body.appendChild(this.catElement);

        // Track user activity
        this.setupActivityListeners();
        
        // Start with idle state
        this.setState('idle');
    }

    setupActivityListeners() {
        let activityEvents = ['mousemove', 'keydown', 'scroll', 'click'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                this.onUserActivity();
            });
        });
    }

    onUserActivity() {
        // When user is active, set to idle
        if (this.currentState === 'sleeping') {
            this.setState('idle');
        }
        
        // Reset inactivity timer
        clearTimeout(this.inactivityTimer);
        this.inactivityTimer = setTimeout(() => {
            this.setState('sleeping');
        }, 5000); // Sleep after 5 seconds of inactivity
    }

    setState(state) {
        if (this.currentState === state) return;
        
        // Remove old state class
        this.catElement.classList.remove(this.currentState);
        
        // Add new state class
        this.currentState = state;
        this.catElement.classList.add(state);
        
        // Change cat emoji based on state
        if (state === 'loading') {
            this.catElement.innerHTML = '🐱';
        } else if (state === 'idle') {
            this.catElement.innerHTML = '😺';
        } else if (state === 'sleeping') {
            this.catElement.innerHTML = '😴';
        }
    }

    showLoading() {
        this.setState('loading');
    }

    hideLoading() {
        this.setState('idle');
    }
}

// Initialize cat loader when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.catLoader = new CatLoader();
    });
} else {
    window.catLoader = new CatLoader();
}
