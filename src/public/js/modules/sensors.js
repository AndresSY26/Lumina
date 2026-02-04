import { lerpAngle } from '../utils.js';

export class SensorModule {
    constructor() {
        this.heading = 0;
        this.coords = { latitude: 0, longitude: 0 };
        this.hasPerms = false;
        this.isAbsolute = false;
        
        this.onUpdate = null; // Callback
    }

    requestPermissions() {
        // iOS 13+ requires explicit permission for sensors
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            return DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        this.startSensors();
                        return true;
                    }
                    return false;
                });
        } else {
            // Non-iOS or older
            this.startSensors();
            return Promise.resolve(true);
        }
    }

    startSensors() {
        // Geolocation
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(pos => {
                this.coords = pos.coords;
                // GPS available implies absolute positioning capability usually,
                // but strictly for compass we rely on deviceorientation
            }, err => console.warn(err));
        }

        // 1. Listen for Absolute (Android Chrome)
        // This event fires if the device has absolute support.
        window.addEventListener('deviceorientationabsolute', (e) => {
            if (e.alpha !== null) {
                this.isAbsolute = true;
                this.handleOrientation(360 - e.alpha);
            }
        });

        // 2. Standard Event (iOS + Fallback)
        window.addEventListener('deviceorientation', (e) => {
            // If we already have absolute from the other event, ignore this one
            // unless on iOS where webkitCompassHeading IS the absolute one.
            
            if (e.webkitCompassHeading) {
                // iOS Absolute
                this.isAbsolute = true; // iOS compass is absolute
                this.handleOrientation(e.webkitCompassHeading);
            } else if (!this.isAbsolute && e.alpha !== null) {
                // Fallback (Relative)
                // We only use this if we haven't received an absolute event yet
                this.handleOrientation(360 - e.alpha);
            }
        });

        this.hasPerms = true;
    }

    handleOrientation(newHeading) {
        // Shortest Path Interpolation (Smooths 359 -> 1 transitions)
        let delta = newHeading - this.heading;
        while (delta < -180) delta += 360;
        while (delta > 180) delta -= 360;

        // Apply Smoothing (Low Pass Filter)
        this.heading += delta * 0.15;

        // Report update
        if (this.onUpdate) {
            this.onUpdate({
                heading: this.heading,
                coords: this.coords,
                isAbsolute: this.isAbsolute
            });
        }
    }
}
