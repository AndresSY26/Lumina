
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
        let alpha = e.alpha;
        if (!alpha) return;

        if (e.webkitCompassHeading) {
            alpha = e.webkitCompassHeading;
        } else {
            alpha = 360 - alpha; // Simplification for Android
        }

        this.state.heading = alpha;
        Compass.setHeading(alpha);
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
