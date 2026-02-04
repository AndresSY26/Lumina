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

    updateTelemetry(heading, coords, astroData, isAbsolute, targetMode = 'moon') {
        // Compass Rotation
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

        // Astro Data & Target Logic
        if (astroData) {
            this.dom.moonPhase.textContent = astroData.moon.phase.toFixed(2);
            this.dom.moonIllum.textContent = Math.round(astroData.moon.fraction * 100) + '%';
            this.dom.sunRise.textContent = formatTime(astroData.sun.sunrise);
            this.dom.sunSet.textContent = formatTime(astroData.sun.sunset);
            
            // --- ADVANCED NAVIGATION CORE --- 
            
            // 1. Select Target & Get Radians
            // SunCalc: South = 0, West = PI/2 (Positive)
            let rawAzimuthRad = 0;
            if(targetMode === 'sun') {
                rawAzimuthRad = astroData.sun.position.azimuth;
            } else {
                rawAzimuthRad = astroData.moon.position.azimuth;
            }

            // 2. Convert to Compass Degrees (North = 0, East = 90)
            // Function: (rad * 180/PI) + 180
            let targetAzimuth = (rawAzimuthRad * (180 / Math.PI)) + 180;
            targetAzimuth = (targetAzimuth + 360) % 360; // Normalize 0-360

            // 3. Update Visuals
            this.updateGuidanceSystem(heading, targetAzimuth, targetMode);
        }
    }

    updateGuidanceSystem(currentHeading, targetAzimuth, mode) {
        // Calculate Shortest Delta
        let delta = targetAzimuth - currentHeading;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        
        const arrowLeft = document.getElementById('arrow-left');
        const arrowRight = document.getElementById('arrow-right');
        const hintMsg = document.getElementById('guide-msg');
        
        // Reset Arrows
        arrowLeft.classList.remove('active');
        arrowRight.classList.remove('active');
        
        // Thresholds
        const deadZone = 5; // Degrees for lock
        
        if (Math.abs(delta) < deadZone) {
            // LOCKED
            hintMsg.textContent = "OBJETIVO CENTRADO";
            hintMsg.style.color = mode === 'sun' ? 'var(--gold)' : 'var(--primary)';
            hintMsg.style.fontWeight = 'bold';
        } else {
            // GUIDANCE NEEDED
            hintMsg.style.color = 'var(--silver)';
            hintMsg.style.fontWeight = 'normal';
            
            if (delta > 0) {
                // Target is to the RIGHT
                arrowRight.classList.add('active');
                hintMsg.textContent = `GIRA ${Math.round(Math.abs(delta))}° DERECHA`;
            } else {
                // Target is to the LEFT
                arrowLeft.classList.add('active');
                hintMsg.textContent = `GIRA ${Math.round(Math.abs(delta))}° IZQUIERDA`;
            }
        }
        
        // Theme Update (Sun vs Moon Colors on UI)
        if(mode === 'sun') {
            document.documentElement.style.setProperty('--primary', '#ffd700'); // Gold override
            document.querySelector('.heading-indicator').style.borderColor = 'var(--gold) transparent transparent transparent';
        } else {
            document.documentElement.style.setProperty('--primary', '#00f3ff'); // Cyan Restore
            document.querySelector('.heading-indicator').style.borderColor = '#00f3ff transparent transparent transparent';
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
