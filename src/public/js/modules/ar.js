export class ARModule {
    constructor() {
        this.videoElement = document.getElementById('camera-feed');
        this.stream = null;
    }

    async start() {
        if (!this.videoElement) return;
        
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            this.videoElement.srcObject = this.stream;
        } catch (err) {
            console.error("Camera access denied or unavailable", err);
            // Could show a UI error here
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}
