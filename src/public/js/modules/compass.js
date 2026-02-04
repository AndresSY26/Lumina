
import { formatDeg } from '../utils.js';

export const Compass = {
    currentHeading: 0, // Smoothed value for display
    targetHeading: 0,  // Raw value from sensor
    moonAzimuth: 0,
    isLocked: false,
    userHasInteracted: false, // For vibration safety
    
    // UI Elements
    ui: {
        ring: null,
        pointer: null,
        headingVal: null,
        azimuthVal: null,
        deltaVal: null,
        reticle: null
    },

    init() {
        this.cacheDOM();
        // Start loop for smooth UI updates
        setInterval(() => this.updateUI(), 50);
    },

    cacheDOM() {
        this.ui.ring = document.getElementById('compass-ring');
        this.ui.pointer = document.getElementById('moon-pointer');
        this.ui.headingVal = document.getElementById('heading-val');
        this.ui.azimuthVal = document.getElementById('azimuth-val');
        this.ui.deltaVal = document.getElementById('delta-val');
        this.ui.reticle = document.getElementById('target-reticle');
    },

    enableVibration() {
        this.userHasInteracted = true;
    },

    setHeading(newHeading) {
        // Anti-wrap logic: Find shortest path to new heading
        let delta = newHeading - this.currentHeading;
        
        // Normalize delta to be between -180 and 180
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        this.targetHeading = this.currentHeading + delta;
    },

    setMoonAzimuth(deg) {
        this.moonAzimuth = deg;
    },

    updateUI() {
        if (!this.ui.ring) return; 

        // LERP Smoothing
        // Factor 0.15 for "Heavy/Premium" feel
        const SMOOTHING = 0.15;
        this.currentHeading += (this.targetHeading - this.currentHeading) * SMOOTHING;

        // Normalize for display (0-360)
        let displayHeading = this.currentHeading % 360;
        if (displayHeading < 0) displayHeading += 360;

        // DOM Updates
        if (this.ui.headingVal) this.ui.headingVal.innerText = formatDeg(displayHeading);
        if (this.ui.azimuthVal) this.ui.azimuthVal.innerText = formatDeg(this.moonAzimuth);

        // Rotate RING against user movement (N stays North)
        this.ui.ring.style.transform = `rotate(${-this.currentHeading}deg)`;

        // Moon Pointer absolute rotation
        // The pointer is inside the ring. Ring rotates by -heading.
        // We want pointer to point to absolute Azimuth. 
        // Relative to the ring (which is North-referenced), the pointer should be at Azimuth.
        this.ui.pointer.style.transform = `rotate(${this.moonAzimuth}deg)`;

        // Delta calculation
        let delta = Math.abs(displayHeading - this.moonAzimuth);
        if (delta > 180) delta = 360 - delta;

        if (this.ui.deltaVal) this.ui.deltaVal.innerText = delta.toFixed(1);

        // Lock Logic
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
        if (this.ui.reticle) this.ui.reticle.classList.add('target-locked');
        if (this.ui.azimuthVal) this.ui.azimuthVal.classList.add('locked-text');
        
        // Vibration with interaction safety check
        if (this.userHasInteracted && navigator.vibrate) {
            // Try/Catch in case of strict browser policies
            try {
                navigator.vibrate([50, 50, 50]);
            } catch (e) {
                // Silently fail if blocked
            }
        }
    },

    disengageLock() {
        if (this.ui.reticle) this.ui.reticle.classList.remove('target-locked');
        if (this.ui.azimuthVal) this.ui.azimuthVal.classList.remove('locked-text');
    }
};
