
export const UI = {
    // State
    isPro: false,
    
    init() {
        this.checkProStatus();
        this.bindEvents();
        this.startClock();
    },

    bindEvents() {
        // Nav Tabs
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Heuristic to find action
                const icon = item.querySelector('i');
                if (icon) {
                    if (icon.classList.contains('ph-compass')) this.switchView('home');
                    if (icon.classList.contains('ph-camera')) this.switchView('ar');
                    if (icon.classList.contains('ph-star')) this.showPaywall(); // or similar
                }
            });
        });

        // Paywall
        document.querySelectorAll('.paywall-action').forEach(el => {
            el.addEventListener('click', () => this.showPaywall());
        });

        const closePaywall = document.getElementById('close-paywall');
        if (closePaywall) {
            closePaywall.addEventListener('click', () => {
                const modal = document.getElementById('paywall-modal');
                if (modal) {
                    modal.style.opacity = '0';
                    modal.style.pointerEvents = 'none';
                }
            });
        }

        const simBtn = document.getElementById('sim-payment-btn');
        if (simBtn) simBtn.addEventListener('click', () => this.processPayment());
    },

    switchView(viewId) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        
        const homeView = document.getElementById('view-home');
        const arView = document.getElementById('view-ar');
        
        if (viewId === 'home') {
            homeView.classList.remove('hidden');
            arView.classList.add('hidden');
            // Hacky nav active logic
            const nav = document.querySelector('.ph-compass'); 
            if(nav) nav.parentNode.classList.add('active');
            
            // Allow AR module to pause loop if needed (optional optimization)
        } else if (viewId === 'ar') {
            homeView.classList.add('hidden');
            arView.classList.remove('hidden');
            const nav = document.querySelector('.ph-camera');
            if(nav) nav.parentNode.classList.add('active');
            
            // Notify AR to start? It's always running in background in this architecture to be safe/simple
        }
    },

    startClock() {
        const update = () => {
            const now = new Date();
            const clock = document.getElementById('clock');
            const date = document.getElementById('date');
            if (clock) clock.innerText = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            if (date) date.innerText = now.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
        };
        setInterval(update, 1000);
        update();
    },

    // --- PAYWALL ---
    checkProStatus() {
        const isPro = localStorage.getItem('lumina_pro') === 'true';
        if (isPro) this.enableProMode();
    },

    showPaywall() {
        if (this.isPro) return;
        const modal = document.getElementById('paywall-modal');
        if (modal) {
            modal.style.opacity = '1';
            modal.style.pointerEvents = 'auto';
        }
    },

    processPayment() {
        const btn = document.getElementById('sim-payment-btn');
        if (btn) btn.innerText = "PROCESSING...";
        
        setTimeout(() => {
            if (btn) {
                btn.innerText = "ACCESS GRANTED";
                btn.classList.remove('btn-gold');
                btn.classList.add('btn-success');
            }

            setTimeout(() => {
                this.enableProMode();
                const modal = document.getElementById('paywall-modal');
                if (modal) {
                    modal.style.opacity = '0';
                    modal.style.pointerEvents = 'none';
                }
            }, 1000);
        }, 1500);
    },

    enableProMode() {
        this.isPro = true;
        localStorage.setItem('lumina_pro', 'true');

        const topTrigger = document.getElementById('paywall-trigger-top');
        if (topTrigger) {
             topTrigger.innerHTML = '<i class="ph ph-check-circle"></i> UNLOCKED';
             topTrigger.classList.add('pro-active');
        }

        document.querySelectorAll('.paywall-action').forEach(el => {
            // If it's the nav item, we don't change style as much, but for cards we do
            if (el.classList.contains('card') || el.classList.contains('btn-mini')) {
                 // Logic to unlock visual
            }
             // Remove paywall click listener by cloning? 
             // In this module architecture we already bound it. 
             // We can just check `this.isPro` in showPaywall to exist early.
        });
        
        // Visual updates for Cards
        // This is a bit specific, but let's just make sure cards look unlocked
        const lockedCards = document.querySelectorAll('.card-locked');
        lockedCards.forEach(c => {
            c.classList.remove('card-locked');
            c.classList.add('card-unlocked');
        });
    }
};
