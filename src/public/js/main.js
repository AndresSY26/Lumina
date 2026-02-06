import { SensorModule } from './modules/sensors.js';
import { AstronomyModule } from './modules/astronomy.js';
import { GraphModule } from './modules/graph.js';
import { UIModule } from './modules/ui.js';
import { ARModule } from './modules/ar.js';
import { Router } from './modules/router.js';
import { Moon3DModule } from './modules/moon-3d.js'; 
import { LandingMoonModule } from './modules/landing-moon.js'; // [NEW]
import { checkIsMobile } from './modules/device-check.js';


class App {
    constructor() {
        this.ui = new UIModule();
        // Lazy Load Modules (instantiate but don't start)
        this.sensors = new SensorModule(); 
        this.astro = new AstronomyModule();
        this.graph = new GraphModule('trajectory-canvas');
        this.ar = new ARModule();
        
        // 3D Moon (Visual only, safe to instantiate, but wait to init)
        this.moon3D = new Moon3DModule('moon-3d-container');
        this.landingScene = null; // Dedicated Landing Scene

        this.router = new Router(this);
        
        // Navigation State
        this.targetMode = 'moon'; // 'moon' | 'sun'

        // Check Device & Init
        // Check Device & Init
        const isMobile = checkIsMobile();
        // [MODIFIED] We delay the check. We allow Desktop on Landing/Auth.
        // The check will happen in onViewChange for 'setup' or 'mission'.

        this.init();
    }

    init() {
        // Initialize Router
        this.router.init();

        // Wire up Navigation
        this.ui.setupNavigation((viewId) => this.onViewChange(viewId));

        // Wire up Sensors -> UI
        this.sensors.onUpdate = (data) => {
            let astroData = null;
            if(data.coords.latitude !== 0) {
                astroData = this.astro.update(data.coords.latitude, data.coords.longitude);
            }
            this.ui.updateTelemetry(data.heading, data.coords, astroData, data.isAbsolute, this.targetMode);
            
            // Update 3D Moon Phase
            if(astroData && this.moon3D.isInit) {
                this.moon3D.updatePhase(astroData.moon.phase);
            }
        };

        // Wire up Permissions (Intercepted by Desktop Gatekeeper)
        const btnPerms = document.getElementById('btn-grant-perms');
        if(btnPerms) {
            btnPerms.addEventListener('click', () => {
                // 1. GATEKEEPER CHECK again (User might have resized window info)
                if (!checkIsMobile() && !this.bypassMode) {
                    console.log('🛑 Desktop Environment Detected. Intercepting...');
                    this.showDesktopOverlay();
                    return; 
                }

                // 2. Mobile Flow (Normal) - Request actual permissions
                this.sensors.requestPermissions().then(granted => {
                    if(granted) {
                        this.router.navigate('/mission');
                    }
                });
            });
        }

        // Wire up Bypass Button
        const btnBypass = document.getElementById('btn-bypass');
        if (btnBypass) {
            btnBypass.addEventListener('click', () => {
                console.warn('⚠️ User Bypassed Desktop Restriction');
                document.getElementById('desktop-overlay').classList.add('hidden');
                this.bypassMode = true;
                
                // If on setup, try to move forward
                if (this.router.currentStep === 'setup') {
                     // In simulation we just go
                     this.router.navigate('/mission');
                }
            });
        }

        // Wire up Target Toggle
        const btnToggle = document.getElementById('btn-target-toggle');
        if(btnToggle) {
            btnToggle.addEventListener('click', () => {
                this.targetMode = this.targetMode === 'moon' ? 'sun' : 'moon';
                // Update visuals...
                const icon = btnToggle.querySelector('.icon-mode');
                const text = btnToggle.querySelector('.text-mode');
                if(this.targetMode === 'sun') {
                    btnToggle.classList.replace('mode-moon', 'mode-sun');
                    icon.classList.replace('ph-moon-stars', 'ph-sun');
                    text.textContent = 'SOL';
                } else {
                    btnToggle.classList.replace('mode-sun', 'mode-moon');
                    icon.classList.replace('ph-sun', 'ph-moon-stars');
                    text.textContent = 'LUNA';
                }
            });
        }
    }

    // Called by Router when ENTRIES Mission Phase
    startMissionParams() {
        console.log('🚀 Mission Started. Activating heavy systems...');
        
        // 1. Resize Graph
        this.graph.resize();

        // 2. Init 3D Moon
        if (!this.moon3D.isInit) {
            this.moon3D.init();
        }
        
        // 3. Start Sensors (If not already started)
        // Check if we have perms or if we are bypassed. 
        // Realistically, we shouldn't be here unless perms granted or bypassed.
        if (this.sensors) {
             // In a perfect world we check sensors.hasPerms, 
             // but requestPermissions() usually handles the startSensors logic.
             // If we navigated here directly (e.g. refresh on /mission), we might need to ask again?
             // Browsers remember permissions often.
             this.sensors.requestPermissions().then(g => console.log('Sensors active:', g));
        }
    }

    // Called by Router when LEAVING Mission Phase
    pauseMissionParams() {
        console.log('⏸️ Pausing Mission systems...');
        if (this.ar) this.ar.stop();
        // We could stop sensors here to save battery
    }


    onViewChange(viewId) {
        // Lifecycle management
        
        // [NEW] Desktop Gatekeeper for Protected Routes
        // If we are navigating to SETUP or MISSION, we enforce Mobile.
        if (viewId === 'setup' || viewId === 'mission' || viewId === 'view-home' || viewId === 'view-ar') {
             const isMobile = checkIsMobile();
             if (!isMobile) {
                 console.log('🛑 Protective Layer: Desktop Detected on Protected Route.');
                 this.showDesktopOverlay();
                 return; // Stop other logic if needed? 
                 // Actually showDesktopOverlay doesn't stop execution, it just covers screen.
                 // But typically we might want to pause things.
                 // For now, overlay is enough.
             }
        }

        // 1. Landing 3D Moon
        if (viewId === 'landing' || viewId === 'view-landing' || !viewId) { 
            if (!this.landingScene) {
                const container = document.getElementById('hero-moon-canvas');
                if (container) {
                    this.landingScene = new LandingMoonModule('hero-moon-canvas');
                    this.landingScene.init();
                }
            }
            if (this.landingScene) this.landingScene.start();
        } else {
            if (this.landingScene) this.landingScene.stop();
        }

        // 2. Mission 3D Moon
        if (viewId === 'mission') {
            // Mission Logic handled in startMissionParams mostly, but visualization:
             if(this.moon3D && this.moon3D.isInit) this.moon3D.start();
        } else {
             if(this.moon3D) this.moon3D.stop();
        }

        // 3. AR
        if (viewId === 'view-ar') {
            this.ar.start();
        } else {
            this.ar.stop();
        }
        
        if (viewId === 'view-home') {
            this.graph.resize(); 
        }
    }

    showDesktopOverlay() {
        const overlay = document.getElementById('desktop-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }
}

// Start App (Always, but internal logic decides what to do)
window.app = new App();
