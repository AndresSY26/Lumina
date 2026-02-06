/* global THREE */

export class LandingSceneModule {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.moon = null;
        this.isInit = false;
        this.animationId = null;
        this.isAnimating = false;
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) return;
        if (this.isInit) return;

        // 1. SETUP SCENE
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.scene = new THREE.Scene();

        // Camera: Adjusted for cinematic view
        this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
        this.camera.position.z = 25; // Adjusted to crop/frame nicely

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0); // Explicit transparent background
        this.container.appendChild(this.renderer.domElement);

        // 2. MATERIALS & APPERANCE
        const textureLoader = new THREE.TextureLoader();
        
        // Premium High-Res Textures
        const colorMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg');
        const bumpMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_4k.jpg');

        const geometry = new THREE.SphereGeometry(6, 64, 64); // Slightly larger
        const material = new THREE.MeshStandardMaterial({
            map: colorMap,
            bumpMap: bumpMap,
            bumpScale: 0.05, // Depth for craters
            roughness: 0.8,  // Dusty look, not shiny
            metalness: 0.1
        });

        this.moon = new THREE.Mesh(geometry, material);
        this.moon.rotation.y = -Math.PI / 2; // Start showing a good face
        this.scene.add(this.moon);

        // 3. CINEMATIC LIGHTING (EXTREME REALISM)
        // Ambient: Almost black, just enough to not lose shape entirely
        const ambientLight = new THREE.AmbientLight(0x4040ff, 0.05);
        this.scene.add(ambientLight);

        // Key Light: Strong side light for "Crescent" drama and shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
        directionalLight.position.set(5, 0, 2); // Side/Front-ish to cast long shadows
        this.scene.add(directionalLight);

        // Rim Light (Backlight) - Optional poetic touch
        const rimLight = new THREE.DirectionalLight(0x00f3ff, 0.2); // Fainter
        rimLight.position.set(-10, 5, -10); // Back Left
        this.scene.add(rimLight);

        // 4. INTERACTION & EVENTS
        this.setupInteraction();
        window.addEventListener('resize', () => this.resize());

        this.isInit = true;
        this.start();
    }

    setupInteraction() {
        // Subtle Mouse Follow
        window.addEventListener('mousemove', (e) => {
            if (!this.isAnimating) return;
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            // Target Rotation interaction
            if (this.moon) {
                // We add to the base rotation so we don't snap back
                // But simple offset works well for this view
                // We'll let the animate loop handle base rotation
            }
        });
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
        
        if (this.moon) {
            this.moon.rotation.y += 0.002; // "Proof of Life" constant rotation
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}
