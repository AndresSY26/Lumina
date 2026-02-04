import { SensorModule } from './modules/sensors.js';
import { AstronomyModule } from './modules/astronomy.js';
import { GraphModule } from './modules/graph.js';
import { UIModule } from './modules/ui.js';
import { ARModule } from './modules/ar.js';

class App {
    constructor() {
        this.ui = new UIModule();
        this.sensors = new SensorModule();
        this.astro = new AstronomyModule();
        this.graph = new GraphModule('trajectory-canvas');
        this.ar = new ARModule();

        this.init();
    }

    init() {
        // Wire up Navigation
        this.ui.setupNavigation((viewId) => this.onViewChange(viewId));

        // Wire up Sensors -> UI
        this.sensors.onUpdate = (data) => {
            let astroData = null;
            if(data.coords.latitude !== 0) {
                astroData = this.astro.update(data.coords.latitude, data.coords.longitude);
            }
            this.ui.updateTelemetry(data.heading, data.coords, astroData);
        };

        // Wire up Permissions
        const btnPerms = document.getElementById('btn-grant-perms');
        if(btnPerms) {
            btnPerms.addEventListener('click', () => {
                this.sensors.requestPermissions().then(granted => {
                    if(granted) this.ui.hidePermissionModal();
                });
            });
        }
    }

    onViewChange(viewId) {
        // Lifecycle management
        if (viewId === 'view-ar') {
            this.ar.start();
        } else {
            this.ar.stop();
        }
        
        if (viewId === 'view-home') {
            this.graph.resize(); // Ensure canvas is sized right
        }
    }
}

window.app = new App();
