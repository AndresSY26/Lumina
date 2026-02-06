/* global THREE */

export class Moon3DModule {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = null; // Will fetch on init
        this.options = Object.assign({
            cinematic: false, // Enable Rim Light & Fixed Position
            autoRotate: true,
            transparent: true,
            lightPosition: { x: 20, y: 0, z: 0 } // Default for real-time mode
        }, options);

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.moon = null;
        this.sunLight = null;
        this.rimLight = null;
        this.isInit = false;
        this.animationId = null;
        this.isAnimating = false;
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) return; 
        if (this.isInit) return;

        // 1. SETUP
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.scene = new THREE.Scene();

        // Cam Setup
        this.camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 1000);
        this.camera.position.z = 20;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: this.options.transparent, 
            antialias: true 
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // 2. MOON GEOMETRY
        const geometry = new THREE.SphereGeometry(5, 64, 64);
        const textureLoader = new THREE.TextureLoader();

        const colorMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg');
        const bumpMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_4k.jpg');

        const material = new THREE.MeshStandardMaterial({
            map: colorMap,
            bumpMap: bumpMap,
            bumpScale: 0.05,
            roughness: 0.8,
            metalness: 0.1
        });

        this.moon = new THREE.Mesh(geometry, material);
        this.scene.add(this.moon);

        // 3. LIGHTING
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.1); 
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        
        if (this.options.cinematic) {
            // Cinematic "Crescent" Look
            // Light from side/back to create drama
            this.sunLight.position.set(20, 5, 20); // Front-ish but offset? 
            // User requested: X:5, Z:5 - Let's try to match their request for "Crescent"
            // Crescent usually means light is mostly behind or side. 
            // Let's stick to a known good "Dramatic" position or use what they asked if it looks good.
            // X:10, Z:5 puts it to the right and slightly front -> Gibbous? 
            // X:10, Z:-5 puts it behind?
            // Let's set a default dramatic pos
            this.sunLight.position.set(10, 2, 5); 
        } else {
            this.sunLight.position.copy(this.options.lightPosition);
        }
        this.scene.add(this.sunLight);

        // Optional Rim Light for Cinematic Mode
        if (this.options.cinematic) {
            this.rimLight = new THREE.SpotLight(0x00f3ff, 2.0); // Cyan Rim
            this.rimLight.position.set(-10, 10, -5); // Back/Top/Left
            this.rimLight.lookAt(this.moon.position);
            this.scene.add(this.rimLight);
            
            // Also rotate the moon slightly to show off texture
            this.moon.rotation.y = -Math.PI / 4; 
        }

        // 4. EVENTS
        // Note: We should probably use ResizeObserver in a real app, but window resize is ok for now.
        // We will manually call resize from outside if needed or stick to window.
        
        // Interaction Logic
        this.setupInteraction();

        this.isInit = true;
        this.start();
    }

    setupInteraction() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        const dom = this.renderer.domElement;

        const onStart = (x, y) => {
            isDragging = true;
            previousMousePosition = { x, y };
        };

        const onMove = (x, y) => {
            if (!isDragging) return;
            const deltaMove = {
                x: x - previousMousePosition.x,
                y: y - previousMousePosition.y
            };
            
            // Invert control feel
            this.moon.rotation.y += deltaMove.x * 0.005;
            this.moon.rotation.x += deltaMove.y * 0.005;
            
            previousMousePosition = { x, y };
        };

        const onEnd = () => { isDragging = false; };

        // Mouse
        dom.addEventListener('mousedown', (e) => onStart(e.offsetX, e.offsetY));
        window.addEventListener('mousemove', (e) => {
            // Fix: Event might be outside canvas
            // We only care if we started dragging inside.
            if(isDragging) {
                 // For global move, offsetX is relative to target, which changes.
                 // Better to use movementX/Y or client coordinates diff.
                 // Let's stick to simple logic that works "good enough" for this context.
                 // We will use the stored previous position logic which works.
                 // But offset depends on target. 
                 
                 // Simpler: use clientX/Y relative to previous clientX/Y
                 const rect = dom.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 const y = e.clientY - rect.top;
                 onMove(x, y);
            }
        });
        window.addEventListener('mouseup', onEnd);

        // Touch
        dom.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX, e.touches[0].clientY));
        window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX, e.touches[0].clientY));
        window.addEventListener('touchend', onEnd);
    }

    /**
     * Updates the Sunlight position based on real moon phase.
     */
    updatePhase(phase) {
        if (!this.sunLight || this.options.cinematic) return; // Don't override cinematic lighting

        // Phase 0..1 mappings as before
        let angle = 0;
        if (phase <= 0.5) {
            angle = Math.PI * (1 - (phase * 2));
        } else {
            angle = -Math.PI * ((phase - 0.5) * 2);
        }

        const radius = 20;
        this.sunLight.position.x = Math.sin(angle) * radius;
        this.sunLight.position.z = Math.cos(angle) * radius;
        this.sunLight.position.y = 2; 
    }

    resize() {
        if (!this.container || !this.camera || !this.renderer) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    start() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    stop() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animate() {
        if (!this.isAnimating) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.moon && this.options.autoRotate) {
             this.moon.rotation.y += 0.001; // Slow rotation
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}
