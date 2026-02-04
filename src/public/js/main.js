
import { UI } from './modules/ui.js';
import { Compass } from './modules/compass.js';
import { Telemetry } from './modules/telemetry.js';
import { Graph } from './modules/graph.js';
import { AR } from './modules/ar.js';
import { safeText } from './utils.js';

const App = {
    // Global State
    state: {
        lat: 0,
        lon: 0,
        heading: 0
    },

    init() {
        console.log("🚀 Starting Lumina Modular System...");

        // Init Modules
        UI.init();
        Compass.init();
        Graph.init();
        AR.init();

        // Boot
        this.cacheDOM();
        this.bindEvents();
        
        // Start Data Loops
        this.requestLocation();
        this.requestSensors();
        
        // Register SW
        this.registerSW();

        // One-time interaction listener for vibration permission
        const enableInteraction = () => {
            Compass.enableVibration();
            document.removeEventListener('click', enableInteraction);
            document.removeEventListener('touchstart', enableInteraction);
        };
        document.addEventListener('click', enableInteraction, { once: true });
        document.addEventListener('touchstart', enableInteraction, { once: true });
    },

    cacheDOM() {
        this.bootSeq = document.getElementById('boot-sequence');
        this.startBtn = document.getElementById('system-start-btn');
        this.sensorStatus = document.getElementById('sensor-status');
        this.reqPermBtn = document.getElementById('request-perm-btn');
        this.permModal = document.getElementById('permission-modal');
    },

    bindEvents() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                if (this.bootSeq) {
                    this.bootSeq.style.opacity = '0';
                    setTimeout(() => {
                        this.bootSeq.style.display = 'none';
                        const main = document.getElementById('main-app');
                        if (main) {
                            main.style.opacity = '1';
                            // Trigger resize for canvas
                            window.dispatchEvent(new Event('resize'));
                        }
                    }, 700);
                }
            });
        }

        if (this.reqPermBtn) {
            this.reqPermBtn.addEventListener('click', () => this.requestSensorsPermission());
        }

        // Loop for Telemetry updates (1s)
        setInterval(() => this.loop(), 1000);
    },

    loop() {
        // Core Logic Loop
        const data = Telemetry.update(this.state.lat, this.state.lon);
        if (data) {
            Compass.setMoonAzimuth(data.azimuth);
            Graph.draw(data.moonTimes);
        }
    },

    // --- Geolocation ---
    requestLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(
                (pos) => {
                    this.state.lat = pos.coords.latitude;
                    this.state.lon = pos.coords.longitude;
                    safeText('gps-coords', `${this.state.lat.toFixed(4)}, ${this.state.lon.toFixed(4)}`);
                    // Immediate update
                    this.loop();
                },
                (err) => console.error("Geo Error:", err),
                { enableHighAccuracy: true }
            );
        }
    },

    // --- Sensors ---
    requestSensors() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+
            if (this.permModal) this.permModal.classList.remove('hidden');
        } else {
            // Android/Legacy
            this.startOrientationListener();
        }
    },

    requestSensorsPermission() {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    if (this.permModal) this.permModal.classList.add('hidden');
                    this.startOrientationListener();
                }
            })
            .catch(console.error);
    },

    startOrientationListener() {
        // Try Absolute first
        window.addEventListener('deviceorientationabsolute', (e) => this.handleOrientation(e), true);
        window.addEventListener('deviceorientation', (e) => this.handleOrientation(e), true);
        
        safeText('sensor-status', 'ONLINE');
        if (this.sensorStatus) {
            this.sensorStatus.classList.remove('status-error');
            this.sensorStatus.classList.add('status-active');
        }
    },

    handleOrientation(e) {
        let alpha = e.alpha; // Z-axis rotation [0, 360)

        // Null check
        if (alpha === null) return;

        // iOS: WebkitCompassHeading is True North (if available)
        if (typeof e.webkitCompassHeading !== 'undefined' && e.webkitCompassHeading !== null) {
            // iOS heading is 0=North, 90=East. 
            // We use this directly as it's the most accurate on iOS.
            this.state.heading = e.webkitCompassHeading;
        } 
        // Android/Standard: alpha is 0=North (if absolute) or random (if relative)
        // alpha increases counter-clockwise (unlike compass which is clockwise)
        else {
            if (e.absolute) {
                // deviceorientationabsolute event
                // This typically points to North.
                // Convert typical JS alpha (CCW) to Compass (CW) and adjust phase if needed
                // Standard: alpha 0 = North, 90 = West, 270 = East.
                // We want 0=North, 90=East.
                this.state.heading = 360 - alpha; 
            } else {
                // Relative orientation (Magnetic or Arbitrary)
                // Fallback. Assuming 0 is initial direction or Magnetic North.
                this.state.heading = 360 - alpha; 
            }
        }
        
        // Normalize
        if (this.state.heading < 0) this.state.heading += 360;
        this.state.heading = this.state.heading % 360;

        Compass.setHeading(this.state.heading);
    },

    registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW Registered'))
                .catch(err => console.error('SW Fail', err));
        }
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => App.init());
