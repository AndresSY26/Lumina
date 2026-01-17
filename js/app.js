// Lumina Core Logic
// v1.0.0

const App = {
    // State
    pos: { lat: 0, lon: 0 },
    heading: 0, // Device heading
    moonAzimuth: 0, // Calculated Moon Azimuth
    moonAltitude: 0,
    isLocked: false,
    isPro: false,
    sensorsPermitted: false,

    // DOM Elements
    ui: {},

    init() {
        console.log("Lumina System Initialize...");
        this.cacheDOM();
        this.bindEvents();
        this.startClock();
        this.checkProStatus();

        // Geolocation is safe to request immediately on most browsers
        this.requestLocation();
    },

    cacheDOM() {
        this.ui = {
            compassRing: document.getElementById('compass-ring'),
            moonPointer: document.getElementById('moon-pointer'),
            headingVal: document.getElementById('heading-val'),
            azimuthVal: document.getElementById('azimuth-val'),
            deltaVal: document.getElementById('delta-val'),
            targetReticle: document.getElementById('target-reticle'),

            phaseVal: document.getElementById('phase-val'),
            illumVal: document.getElementById('illum-val'),
            altVal: document.getElementById('alt-val'),
            distVal: document.getElementById('dist-val'),

            riseTime: document.getElementById('rise-time'),
            zenithTime: document.getElementById('zenith-time'),
            setTime: document.getElementById('set-time'),

            trajectoryCanvas: document.getElementById('trajectory-canvas'),

            arVideo: document.getElementById('ar-video'),
            arToggle: document.getElementById('ar-toggle'),

            paywallModal: document.getElementById('paywall-modal'),
            simPaymentBtn: document.getElementById('sim-payment-btn'),
            closePaywallBtn: document.getElementById('close-paywall'),
            paywallTriggers: document.querySelectorAll('.paywall-action'),

            permissionModal: document.getElementById('permission-modal'),
            requestPermBtn: document.getElementById('request-perm-btn'),
            sensorStatus: document.getElementById('sensor-status'),
        };

        this.ctx = this.ui.trajectoryCanvas.getContext('2d');
    },

    bindEvents() {
        // iOS 13+ requires user interaction for DeviceOrientation
        this.ui.arToggle.addEventListener('click', () => this.initSensors());
        this.ui.requestPermBtn.addEventListener('click', () => this.requestDeviceOrientation());

        // Paywall Interactions
        this.ui.paywallTriggers.forEach(el => {
            el.addEventListener('click', () => this.showPaywall());
        });

        this.ui.closePaywallBtn.addEventListener('click', () => {
            this.ui.paywallModal.style.opacity = '0';
            this.ui.paywallModal.style.pointerEvents = 'none';
        });

        this.ui.simPaymentBtn.addEventListener('click', () => this.processPayment());

        window.addEventListener('resize', () => this.drawTrajectory());
    },

    startClock() {
        setInterval(() => this.updateTelemetry(), 1000); // 1s update for data

        // Fast loop for compass smoothing
        // Using requestAnimationFrame would be smoother, but setInterval is fine for this demo logic
        setInterval(() => this.updateCompassUI(), 50);
    },

    requestLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(
                (position) => {
                    this.pos.lat = position.coords.latitude;
                    this.pos.lon = position.coords.longitude;
                    this.updateTelemetry(); // Immediate update on new lock
                    this.drawTrajectory();
                },
                (err) => console.error("Geo Error:", err),
                { enableHighAccuracy: true }
            );
        }
    },

    initSensors() {
        // Trigger Camera
        this.startCamera();

        // Trigger Sensors Check
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+
            this.ui.permissionModal.classList.remove('hidden');
        } else {
            // Android or Older iOS
            this.startOrientationListener();
        }
    },

    requestDeviceOrientation() {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    this.ui.permissionModal.classList.add('hidden');
                    this.startOrientationListener();
                }
            })
            .catch(console.error);
    },

    startOrientationListener() {
        window.addEventListener('deviceorientationabsolute', (event) => this.handleOrientation(event), true);
        // Fallback for standard deviceorientation if absolute not available
        window.addEventListener('deviceorientation', (event) => this.handleOrientation(event), true);

        this.sensorsPermitted = true;
        this.ui.sensorStatus.innerText = "Sensors Active";
        this.ui.sensorStatus.classList.remove('text-red-500', 'animate-pulse');
        this.ui.sensorStatus.classList.add('text-lumina-cyber');
    },

    handleOrientation(event) {
        if (!event.alpha) return;

        // "alpha" is the compass direction (0 deg is North)
        // Note: webkitCompassHeading is better for iOS
        let alpha = event.alpha;
        if (event.webkitCompassHeading) {
            alpha = event.webkitCompassHeading;
            // iOS heading is direct 0-360.
        } else {
            // Android: alpha is counter-clockwise, convert to 0-360 clockwise from North
            // This is a simplification; handling true North on Android is complex without deviceorientationabsolute
            alpha = 360 - alpha;
        }

        this.heading = alpha;
    },

    startCamera() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(stream => {
                this.ui.arVideo.srcObject = stream;
                this.ui.arVideo.style.opacity = '0.5'; // Dim pass-through for Readability
            })
            .catch(err => console.warn("Camera Init Fail:", err));
    },

    updateTelemetry() {
        const now = new Date();

        // Moon Data via SunCalc
        const moonPos = SunCalc.getMoonPosition(now, this.pos.lat, this.pos.lon);
        const moonIllum = SunCalc.getMoonIllumination(now);
        const moonTimes = SunCalc.getMoonTimes(now, this.pos.lat, this.pos.lon);

        // Convert Radians to Degrees
        this.moonAzimuth = (moonPos.azimuth * 180 / Math.PI) + 180; // SunCalc is south-0 based, normalize to N-0
        this.moonAltitude = moonPos.altitude * 180 / Math.PI;

        // Visual Updates
        this.ui.phaseVal.innerText = this.getMoonPhaseName(moonIllum.phase);
        this.ui.illumVal.innerText = `${Math.round(moonIllum.fraction * 100)}%`;
        this.ui.altVal.innerText = formatDeg(this.moonAltitude);
        this.ui.distVal.innerText = `${Math.round(moonPos.distance)} km`;

        this.ui.riseTime.innerText = formatTime(moonTimes.rise);
        this.ui.setTime.innerText = formatTime(moonTimes.set);

        // Estimate Zenith (simplified mid-point)
        if (moonTimes.rise && moonTimes.set) {
            const zenith = new Date((moonTimes.rise.getTime() + moonTimes.set.getTime()) / 2);
            this.ui.zenithTime.innerText = formatTime(zenith);
        } else {
            this.ui.zenithTime.innerText = "N/A";
        }
    },

    updateCompassUI() {
        // DOM Updates for cached Rotation
        this.ui.headingVal.innerText = Math.round(this.heading).toString().padStart(3, '0') + '°';
        this.ui.azimuthVal.innerText = Math.round(this.moonAzimuth).toString().padStart(3, '0') + '°';

        // Rotate the COMPASS RING against the user's movement so N stays North
        this.ui.compassRing.style.transform = `rotate(${-this.heading}deg)`;

        // Moon Pointer points to the absolute Moon Azimuth relate to the Ring (which is North aligned)
        // Wait, if Ring is North (0), Moon pointer should just be at Moon Azimuth.
        this.ui.moonPointer.style.transform = `rotate(${this.moonAzimuth}deg)`;

        // Calculate Delta (Difference between where user looks (Heading) and Moon)
        // If Heading == Moon Azimuth, user is looking at Moon.
        let delta = Math.abs(this.heading - this.moonAzimuth);
        if (delta > 180) delta = 360 - delta;

        this.ui.deltaVal.innerText = delta.toFixed(1);

        // Target Lock Logic
        if (delta < 5) {
            if (!this.isLocked) {
                this.isLocked = true;
                this.engageLock();
            }
        } else {
            if (this.isLocked) {
                this.isLocked = false;
                this.disengageLock();
            }
        }
    },

    engageLock() {
        this.ui.targetReticle.classList.add('target-locked');
        this.ui.azimuthVal.classList.add('locked-text');
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Haptic feedback
    },

    disengageLock() {
        this.ui.targetReticle.classList.remove('target-locked');
        this.ui.azimuthVal.classList.remove('locked-text');
    },

    drawTrajectory() {
        // Canvas setup
        const cvs = this.ui.trajectoryCanvas;
        const width = cvs.clientWidth;
        const height = cvs.clientHeight;

        // Fix DPI
        cvs.width = width * window.devicePixelRatio;
        cvs.height = height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.ctx.clearRect(0, 0, width, height);

        // Draw "Peak" Curve
        // Representing Moon Path from Rise (left) to Set (right) with Zenith (top)

        this.ctx.beginPath();
        this.ctx.moveTo(0, height);

        // Quadratic Curve for trajectory
        this.ctx.quadraticCurveTo(width / 2, 20, width, height);

        // Gradient Fill
        const grad = this.ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.2)');
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw Current Position Indicator
        // Math: % of time passed between Rise and Set
        const now = new Date();
        const moonTimes = SunCalc.getMoonTimes(now, this.pos.lat, this.pos.lon);

        if (moonTimes.rise && moonTimes.set) {
            const totalDuration = moonTimes.set - moonTimes.rise;
            const elapsed = now - moonTimes.rise;
            let progress = elapsed / totalDuration;

            // Clamp 0-1
            if (progress < 0) progress = 0;
            if (progress > 1) progress = 1;

            // Calculate XY on Quadratic Curve (Bézier)
            // p1=(0,h), c=(w/2, 20), p2=(w,h)
            // q(t) = (1-t)^2 P1 + 2(1-t)t C + t^2 P2
            const t = progress;
            const x = (Math.pow(1 - t, 2) * 0) + (2 * (1 - t) * t * (width / 2)) + (Math.pow(t, 2) * width);
            const y = (Math.pow(1 - t, 2) * height) + (2 * (1 - t) * t * 20) + (Math.pow(t, 2) * height);

            // Draw Dot
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ebbf24'; // Gold
            this.ctx.fill();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#ebbf24';
        }
    },

    getMoonPhaseName(phase) {
        if (phase == 0) return "New Moon";
        if (phase < 0.25) return "Waxing Crescent";
        if (phase == 0.25) return "First Quarter";
        if (phase < 0.5) return "Waxing Gibbous";
        if (phase == 0.5) return "Full Moon";
        if (phase < 0.75) return "Waning Gibbous";
        if (phase == 0.75) return "Last Quarter";
        return "Waning Crescent";
    },

    // Mock Paywall
    checkProStatus() {
        const isPro = localStorage.getItem('lumina_pro') === 'true';
        if (isPro) this.enableProMode();
    },

    showPaywall() {
        if (this.isPro) return;
        this.ui.paywallModal.style.opacity = '1';
        this.ui.paywallModal.style.pointerEvents = 'auto';
    },

    processPayment() {
        this.ui.simPaymentBtn.innerText = "PROCESSING...";
        setTimeout(() => {
            this.ui.simPaymentBtn.innerText = "ACCESS GRANTED";
            this.ui.simPaymentBtn.classList.remove('bg-lumina-gold');
            this.ui.simPaymentBtn.classList.add('bg-green-500', 'text-white');

            setTimeout(() => {
                this.enableProMode();
                this.ui.paywallModal.style.opacity = '0';
                this.ui.paywallModal.style.pointerEvents = 'none';
            }, 1000);
        }, 1500);
    },

    enableProMode() {
        this.isPro = true;
        localStorage.setItem('lumina_pro', 'true');

        // Update UI
        document.getElementById('paywall-trigger-top').innerHTML = '<i class="ph ph-check-circle"></i> UNLOCKED';
        document.getElementById('paywall-trigger-top').classList.add('bg-green-500/20', 'text-green-400', 'border-green-500');

        // Unlock Cards
        this.ui.paywallTriggers.forEach(el => {
            el.classList.remove('opacity-70', 'border-dashed');
            el.classList.add('border-solid', 'border-lumina-gold');
            el.innerHTML = el.innerHTML.replace('lock-key', 'lock-open'); // Change Icon
            // Remove click listener (hacky but works for mock)
            let clone = el.cloneNode(true);
            el.parentNode.replaceChild(clone, el);
        });
    }
};

// Boot
window.addEventListener('DOMContentLoaded', () => App.init());
