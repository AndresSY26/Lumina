import { formatTime } from '../utils.js';

export class UIModule {
    constructor() {
        this.dom = {
            compassRing: document.getElementById('compass-ring'),
            headingVal: document.getElementById('heading-val'),
            moonPhase: document.getElementById('moon-phase'),
            moonIllum: document.getElementById('moon-illum'),
            sunRise: document.getElementById('sun-rise'),
            sunSet: document.getElementById('sun-set'),
            clock: document.getElementById('clock-display'),
            gpsIndicator: document.getElementById('gps-indicator'),
            modals: {
                perms: document.getElementById('modal-permissions'),
                paywall: document.getElementById('modal-paywall')
            }
        };

        this.startClock();
        this.setupModals();
    }

    setupModals() {
        // Permissions handled by main/sensors interaction usually, 
        // but close logic can be here
        if(this.dom.modals.paywall) {
            document.getElementById('btn-close-paywall')?.addEventListener('click', () => {
                this.dom.modals.paywall.classList.add('hidden');
            });
        }
    }

    setupNavigation(onViewChange) {
        const navItems = document.querySelectorAll('.nav-item');
        const views = document.querySelectorAll('.view-panel');

        navItems.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                
                const targetId = btn.dataset.view;
                if(!targetId) {
                    // It's Settings or Config
                    return; 
                }

                // Update Dock
                navItems.forEach(n => n.classList.remove('active'));
                btn.classList.add('active');

                // Switch View (SPA)
                views.forEach(v => {
                    if(v.id === targetId) {
                        v.classList.remove('hidden');
                        setTimeout(() => v.classList.add('active'), 10);
                        if(onViewChange) onViewChange(targetId);
                    } else {
                        v.classList.remove('active');
                        setTimeout(() => v.classList.add('hidden'), 300);
                    }
                });
            });
        });
    }

    updateTelemetry(heading, coords, astroData, isAbsolute) {
        // Compass
        if(this.dom.compassRing) {
             this.dom.compassRing.style.transform = `rotate(${-heading}deg)`;
        }
        if(this.dom.headingVal) {
             // Normalise for display 0-360
             let displayHeading = Math.round(heading % 360);
             if(displayHeading < 0) displayHeading += 360;
             this.dom.headingVal.textContent = `${displayHeading.toString().padStart(3, '0')}°`;
        }

        // GPS/Sensor Status
        if(this.dom.gpsIndicator) {
            if(isAbsolute) {
                this.dom.gpsIndicator.innerHTML = `<i class="ph-bold ph-broadcast"></i> <span class="text-xs">SENSOR: ABSOLUTO</span>`;
                this.dom.gpsIndicator.style.color = 'var(--primary)'; // Cyan/Green
            } else {
                this.dom.gpsIndicator.innerHTML = `<i class="ph-bold ph-warning"></i> <span class="text-xs">SENSOR: RELATIVO</span>`;
                this.dom.gpsIndicator.style.color = 'var(--gold)'; // Warning color
            }
        }

        // Astro
        if (astroData) {
            this.dom.moonPhase.textContent = astroData.moon.phase.toFixed(2);
            this.dom.moonIllum.textContent = Math.round(astroData.moon.fraction * 100) + '%';
            this.dom.sunRise.textContent = formatTime(astroData.sun.sunrise);
            this.dom.sunSet.textContent = formatTime(astroData.sun.sunset);
        }
    }

    startClock() {
        if(!this.dom.clock) return;
        setInterval(() => {
            this.dom.clock.textContent = new Date().toLocaleTimeString();
        }, 1000);
    }
    
    hidePermissionModal() {
        if(this.dom.modals.perms) this.dom.modals.perms.classList.add('hidden');
    }
}
