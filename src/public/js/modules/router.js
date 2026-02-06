export class Router {
    constructor(appContext) {
        this.app = appContext; // Access to main app logic
        
        // Define Routes mapping to DOM IDs
        this.routes = {
            '/': 'landing',
            '/auth': 'auth',
            '/setup': 'setup',
            '/mission': 'mission'
        };

        this.pageIds = {
            landing: document.getElementById('page-landing'),
            auth: document.getElementById('page-auth'),
            setup: document.getElementById('page-setup'),
            mission: document.getElementById('page-mission')
        };
    }

    init() {
        console.log(`🧭 Router Init.`);
        
        // Handle Browser Back/Forward buttons
        window.addEventListener('popstate', () => {
             this.resolveRoute(window.location.pathname, true);
        });

        // Initial Route Resolution
        this.resolveRoute(window.location.pathname, false);

        this.bindEvents();
    }

    bindEvents() {
        // Landing Enter Button
        const btnEnter = document.getElementById('btn-enter');
        if (btnEnter) {
            btnEnter.addEventListener('click', () => {
                this.navigate('/auth');
            });
        }

        // Auth Form
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Simulate Auth Delay
                const btn = authForm.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> AUTORIZANDO...';
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    this.navigate('/setup');
                }, 1000); // 1.0s delay simulation
            });
        }

        // Setup Grant Permissions handled in main.js calls navigate('/mission')
    }

    /**
     * Navigates to a specific path using History API
     * @param {string} path - The path to navigate to (e.g. '/mission')
     */
    navigate(path) {
        if (path === window.location.pathname) return;
        
        // Push State
        history.pushState(null, '', path);
        this.resolveRoute(path, true);
    }

    /**
     * Resolves path to a view and handles transition
     */
    resolveRoute(path, animate = true) {
        // Normalize Path (e.g. /home -> /)
        let targetId = this.routes[path] || 'landing';
        
        // Fallback for unknown routes
        if (!this.pageIds[targetId]) targetId = 'landing';

        console.log(`📍 Routing to: ${path} -> [${targetId}]`);

        // Update State
        this.currentStep = targetId;

        // Hide All
        Object.values(this.pageIds).forEach(el => {
            if (!el) return;
            if (animate && el.classList.contains('active')) {
                el.classList.add('fade-out');
                setTimeout(() => el.classList.add('hidden'), 300);
            } else {
                el.classList.add('hidden');
            }
            el.classList.remove('active', 'fade-in');
        });

        // Show Target
        const target = this.pageIds[targetId];
        if (target) {
            if (animate) {
                setTimeout(() => {
                    target.classList.remove('hidden');
                    // Force Reflow
                    void target.offsetWidth; 
                    target.classList.add('active', 'fade-in');
                }, 300);
            } else {
                target.classList.remove('hidden');
                target.classList.add('active');
            }
        }

        // Notify Logic Layer
        this.onPageChanged(targetId);
    }

    onPageChanged(pageId) {
        // 1. Notify Main Controller (Critical for Lifecycle)
        if (this.app && this.app.onViewChange) {
            this.app.onViewChange(pageId);
        }

        // 2. Legacy/Specific Hooks
        if (pageId === 'mission') {
            // Start Heavy Sensors
            if (this.app && this.app.startMissionParams) {
                this.app.startMissionParams();
            }
        } else {
            // Optional: Pause sensors if leaving mission
            if (this.app && this.app.pauseMissionParams) {
                this.app.pauseMissionParams();
            }
        }
    }
}
