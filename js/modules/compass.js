
import { formatDeg } from '../utils.js';

export const Compass = {
    heading: 0,
    moonAzimuth: 0,
    isLocked: false,
    
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
        // Using requestAnimationFrame would be better but keeping setInterval 50ms to match original logic
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

    setHeading(deg) {
        this.heading = deg;
    },

    setMoonAzimuth(deg) {
        this.moonAzimuth = deg;
    },

    updateUI() {
        if (!this.ui.ring) return; 

        // DOM Updates
        if (this.ui.headingVal) this.ui.headingVal.innerText = formatDeg(this.heading);
        if (this.ui.azimuthVal) this.ui.azimuthVal.innerText = formatDeg(this.moonAzimuth);

        // Rotate RING against user movement (N stays North)
        this.ui.ring.style.transform = `rotate(${-this.heading}deg)`;

        // Moon Pointer absolute rotation
        // If ring is rotated by -heading, and we want pointer to point at Azimuth
        // The pointer is inside the ring. 
        // Logic from original: ui.moonPointer.style.transform = `rotate(${this.moonAzimuth}deg)`;
        // Since ring rotates, the internal 0 (North) moves. Moon Azimuth is absolute to North. 
        // So pointer at MoonAzimuth relative to Ring's North is correct.
        this.ui.pointer.style.transform = `rotate(${this.moonAzimuth}deg)`;

        // Delta
        let delta = Math.abs(this.heading - this.moonAzimuth);
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
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    },

    disengageLock() {
        if (this.ui.reticle) this.ui.reticle.classList.remove('target-locked');
        if (this.ui.azimuthVal) this.ui.azimuthVal.classList.remove('locked-text');
    }
};
