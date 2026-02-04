
export const Graph = {
    canvas: null,
    ctx: null,

    init() {
        this.canvas = document.getElementById('trajectory-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            window.addEventListener('resize', () => this.draw(null)); 
        }
    },

    draw(moonTimes) {
        if (!this.canvas || !this.ctx) return;

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        // Fix DPI
        this.canvas.width = width * window.devicePixelRatio;
        this.canvas.height = height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.ctx.clearRect(0, 0, width, height);

        // Draw "Peak" Curve
        this.ctx.beginPath();
        this.ctx.moveTo(0, height);
        this.ctx.quadraticCurveTo(width / 2, 20, width, height);

        // Gradient
        const grad = this.ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.2)');
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw Current Position Dot
        if (moonTimes && moonTimes.rise && moonTimes.set) {
            const now = new Date();
            const total = moonTimes.set - moonTimes.rise;
            const elapsed = now - moonTimes.rise;
            let progress = elapsed / total;

            if (progress < 0) progress = 0;
            if (progress > 1) progress = 1;

            // Bezier calc
            const t = progress;
            // P0=(0,h), P1=(w/2, 20), P2=(w,h)
            const x = (Math.pow(1 - t, 2) * 0) + (2 * (1 - t) * t * (width / 2)) + (Math.pow(t, 2) * width);
            const y = (Math.pow(1 - t, 2) * height) + (2 * (1 - t) * t * 20) + (Math.pow(t, 2) * height);

            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ebbf24';
            this.ctx.fill();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#ebbf24';
        }
    }
};
