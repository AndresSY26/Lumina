
export const AR = {
    video: null,

    init() {
        this.video = document.getElementById('ar-video');
        if (this.video) {
            // Lazy init only when needed? Or start immediately?
            // User requested "AR.js: Management of video stream and permissions".
            // We can start it now to be ready, or wait for tab switch.
            // Let's start it but keep it efficient.
            this.startCamera();
        }
    },

    startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn("AR not supported");
            return;
        }

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(stream => {
                if (this.video) {
                    this.video.srcObject = stream;
                }
            })
            .catch(err => console.warn("Camera init failed:", err));
    }
};
