/* global THREE, SunCalc */

export class LandingMoonModule {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.moon = null;
        this.sunLight = null;
        this.isInit = false;
        this.isAnimating = false;
        
        // Interaction State
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.autoRotationSpeed = 0.0005;
        this.momentum = { x: 0, y: 0 };
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) return;
        if (this.isInit) return;

        // 1. SETUP SCENE
        this.resizeObserver = new ResizeObserver((entries) => {
             for (let entry of entries) {
                 this.resize();
             }
        });
        this.resizeObserver.observe(this.container);

        // Initial Size Check
        let width = this.container.clientWidth;
        let height = this.container.clientHeight;
        
        console.log(`📏 Hero Moon Container Size: ${width}x${height}`);

        if (width === 0 || height === 0) {
             console.debug('ℹ️ Container initially hidden. ResizeObserver waiting for visibility...');
             // Set a default to avoid WebGL errors, but it will be resized instantly on display
             width = 100; 
             height = 100;
        }

        this.scene = new THREE.Scene();

        // Camera
        // Adjusted Z to 23.5: The mathematical limit. Moon touches top/bottom edges exactly (Full Frame).
        this.camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 1000);
        this.camera.position.z = 23.5; 

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
        this.renderer.setClearColor(0x000000, 0);
        
        // CSS specific for grabbing
        this.renderer.domElement.style.cursor = 'grab';
        this.container.appendChild(this.renderer.domElement);

        // 2. HERO MOON MATERIAL
        const textureLoader = new THREE.TextureLoader();
        
        // High-Res Textures
        // Using 1024x512 for stability (4k was returning 404)
        const colorMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg');
        // Reusing the same map for bump if 4k is unavailable, or using a specific one if found. 
        // For now, using the color map as bump is better than a 404.
        const bumpMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg');

        const geometry = new THREE.SphereGeometry(5, 64, 64);
        const material = new THREE.MeshStandardMaterial({
            map: colorMap,
            bumpMap: bumpMap,
            bumpScale: 0.12, // Deep craters
            roughness: 0.9,  // Very matte/dusty
            metalness: 0.0
        });

        this.moon = new THREE.Mesh(geometry, material);
        // Initial Rotation (aesthetic start)
        this.moon.rotation.y = -Math.PI / 2; 
        this.targetRotation.y = -Math.PI / 2;
        this.scene.add(this.moon);

        // 3. REAL-TIME PHASE LIGHTING
        this.setupLighting();

        // 4. INTERACTION
        this.setupInteraction();
        window.addEventListener('resize', () => this.resize());

        this.isInit = true;
        this.start();
        console.log('🌕 Hero Moon Initialized');
    }

    setupLighting() {
        // Ambient: Increased visibility (was 0.02 which is too dark)
        const ambientLight = new THREE.AmbientLight(0x4040ff, 0.2); 
        this.scene.add(ambientLight);

        // Sun: Calculated from Phase
        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.5); // Boost intensity
        this.sunLight.castShadow = true;
        this.scene.add(this.sunLight);

        // Fill Light (Camera-aligned): Ensures the moon is never 100% invisible
        const fillLight = new THREE.PointLight(0xffffff, 0.5);
        fillLight.position.copy(this.camera.position);
        this.scene.add(fillLight);

        // Rim Light (Artistic touch)
        const rim = new THREE.DirectionalLight(0x00ffff, 0.4);
        rim.position.set(0, 5, -10);
        this.scene.add(rim);

        this.updateSunPosition();
    }

    updateSunPosition() {
        // Calculate Phase logic using SunCalc
        // Note: We are simulating the "View from Earth" roughly by moving the light source
        const now = new Date();
        const moonIllumination = SunCalc.getMoonIllumination(now);
        const phase = moonIllumination.phase; // 0.0 - 1.0 (New Moon -> Full -> New)

        console.log(`🌗 Moon Phase: ${phase.toFixed(2)}`);

        // Map phase to angle (0 -> 2PI)
        // 0.0 (New) -> Sun is BEHIND Moon (from Earth perspective) -> Light at Z = -20
        // 0.5 (Full) -> Sun is BEHIND Camera (front of Moon) -> Light at Z = +20
        
        // Simple planar orbit for dramatic effect
        const radius = 20;
        const angle = (phase * Math.PI * 2) - Math.PI; // Offset to match visuals

        // Position the light
        // x = sin(angle), z = cos(angle)
        // Adjust coordinate system to match visual expectation
        this.sunLight.position.set(
            Math.sin(angle) * radius, 
            0, 
            Math.cos(angle) * radius
        );
    }

    setupInteraction() {
        const dom = this.renderer.domElement;

        const onStart = (x, y) => {
            this.isDragging = true;
            this.previousMousePosition = { x, y };
            dom.style.cursor = 'grabbing';
            this.momentum = { x: 0, y: 0 }; // Reset momentum
        };

        const onMove = (x, y) => {
            if (!this.isDragging) return;
            
            const deltaMove = {
                x: x - this.previousMousePosition.x,
                y: y - this.previousMousePosition.y
            };

            const sensitivity = 0.005;
            
            // Apply rotation
            this.targetRotation.y += deltaMove.x * sensitivity;
            this.targetRotation.x += deltaMove.y * sensitivity;
            
            // Store momentum
            this.momentum = {
                x: deltaMove.y * sensitivity, // X rot is driven by Y move
                y: deltaMove.x * sensitivity  // Y rot is driven by X move
            };

            this.previousMousePosition = { x, y };
        };

        const onEnd = () => {
            this.isDragging = false;
            dom.style.cursor = 'grab';
        };

        // Mouse Events
        dom.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', onEnd);

        // Touch Events
        dom.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX, e.touches[0].clientY), {passive: false});
        window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX, e.touches[0].clientY), {passive: false});
        window.addEventListener('touchend', onEnd);
    }

    resize() {
        if (!this.container || !this.camera || !this.renderer) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        
        // Debug Smart Adapt
        // console.debug(`📐 Resized Moon Viewport: ${width}x${height} (Aspect: ${this.camera.aspect.toFixed(2)})`);
    }

    start() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    stop() {
        this.isAnimating = false;
    }

    animate() {
        if (!this.isAnimating) return;
        requestAnimationFrame(() => this.animate());

        if (this.moon) {
            // Apply Momentum / Damping when not dragging
            if (!this.isDragging) {
                // Apply very slow friction
                this.momentum.x *= 0.95;
                this.momentum.y *= 0.95;
                
                // Add momentum to rotation
                this.targetRotation.x += this.momentum.x;
                this.targetRotation.y += this.momentum.y;

                // Add Auto-Rotation if momentum is negligible
                if (Math.abs(this.momentum.y) < 0.0001) {
                    this.targetRotation.y += this.autoRotationSpeed;
                }
            }

            // Smoothly interpolate current rotation to target
            // Lerp factor
            const factor = 0.1;
            this.moon.rotation.x += (this.targetRotation.x - this.moon.rotation.x) * factor;
            this.moon.rotation.y += (this.targetRotation.y - this.moon.rotation.y) * factor;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
