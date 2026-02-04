import { lerpAngle } from '../utils.js';

export class SensorModule {
    constructor() {
        this.heading = 0;
        this.targetHeading = 0;
        this.coords = { latitude: 0, longitude: 0 };
        this.hasPerms = false;
        
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
            }, err => console.warn(err));
        }

        // Compass
        window.addEventListener('deviceorientation', (e) => {
            if (e.webkitCompassHeading) {
                // iOS
                this.targetHeading = e.webkitCompassHeading;
            } else if (e.alpha) {
                // Android (approximate, needs compensation)
                this.targetHeading = 360 - e.alpha;
            }
        });

        this.hasPerms = true;
        this.startLoop();
    }

    startLoop() {
        const loop = () => {
            // Smooth interpolation
            this.heading = lerpAngle(this.heading, this.targetHeading, 0.1);
            
            if (this.onUpdate) {
                this.onUpdate({
                    heading: this.heading,
                    coords: this.coords
                });
            }
            requestAnimationFrame(loop);
        };
        loop();
    }
}
