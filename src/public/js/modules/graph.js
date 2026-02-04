export class GraphModule {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if(!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // Resize
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.drawCurve(0.5); // Default
    }

    drawCurve(progress) {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        // Draw sine wave path
        ctx.beginPath();
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        
        for (let x = 0; x <= width; x++) {
            // Simple sine approximation of sun path
            const y = height - (Math.sin((x / width) * Math.PI) * (height * 0.8));
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw current position (Sun)
        // ... (can be expanded)
    }
}
