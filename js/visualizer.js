class Visualizer {
    constructor(canvas, centerImage) {
        this.canvas = canvas;
        this.centerImage = centerImage;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isPlaying = false;
        this.settings = { type: 'monstercat', fillType: 'image', customColor: '#1A1A1A', spectrumColor: '#FFFFFF', backgroundColor: '#000000', smoothing: 0.8, barCount: 256, sensitivity: 2.5, size: 1.0 };
        document.getElementById('visualizer-wrapper').style.backgroundColor = this.settings.backgroundColor;
    }

    connect(audioElement) {
        if (this.audioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.source = this.audioContext.createMediaElementSource(audioElement);
    }

    applySettings(newSettings) {
        this.settings = Object.assign({}, this.settings, newSettings);
        document.getElementById('visualizer-wrapper').style.backgroundColor = this.settings.backgroundColor;
        this.updateAnalyserSettings();
    }

    updateAnalyserSettings() {
        if (!this.analyser) return;
        this.analyser.smoothingTimeConstant = this.settings.smoothing;
        this.analyser.fftSize = this.settings.type === 'monstercat' ? 2048 : Math.pow(2, Math.floor(Math.log2(this.settings.barCount * 2)));
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    }

    renderFrame() {
        requestAnimationFrame(() => this.renderFrame());
        if (!this.isPlaying || !this.analyser) return;
        this.analyser.getByteFrequencyData(this.dataArray);
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        const { width, height } = rect;
        const centerX = width / 2;
        const centerY = height / 2;
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.fillStyle = this.settings.spectrumColor;
        this.ctx.strokeStyle = this.settings.spectrumColor;
        const isRingType = this.settings.type.startsWith('ring');
        this.centerImage.classList.toggle('is-ring', isRingType);
        const baseRadius = (Math.min(width, height) * 0.18) * this.settings.size;
        if (isRingType) {
            this.centerImage.style.width = `${baseRadius * 2}px`;
            this.centerImage.style.height = `${baseRadius * 2}px`;
            if (this.settings.fillType !== 'image' && this.settings.fillType !== 'hollow') {
                this.ctx.beginPath(); this.ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
                this.ctx.fillStyle = this.settings.fillType === 'spectrum_color' ? this.settings.spectrumColor : this.settings.customColor;
                this.ctx.fill();
            }
        } else {
            this.centerImage.style.width = '0px';
            this.centerImage.style.height = '0px';
        }

        this.updateAndDrawParticles(width, height);
        const barCount = this.settings.barCount;

        switch (this.settings.type) {
            case 'ring_bars': case 'ring_smooth': {
                const radius = baseRadius * 1.1; this.ctx.lineWidth = 3;
                if (this.settings.type === 'ring_smooth') this.ctx.beginPath();
                for (let i = 0; i < barCount; i++) {
                    const barHeight = Math.pow(this.dataArray[i] / 255, this.settings.sensitivity) * height * 0.2;
                    const angle = (i / barCount) * 2 * Math.PI;
                    const x1 = centerX + Math.cos(angle) * radius; const y1 = centerY + Math.sin(angle) * radius;
                    const x2 = centerX + Math.cos(angle) * (radius + barHeight); const y2 = centerY + Math.sin(angle) * (radius + barHeight);
                    if (this.settings.type === 'ring_bars') { this.ctx.beginPath(); this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2); this.ctx.stroke(); } 
                    else { i === 0 ? this.ctx.moveTo(x2, y2) : this.ctx.lineTo(x2, y2); }
                }
                if (this.settings.type === 'ring_smooth') { this.ctx.closePath(); this.ctx.stroke(); }
                break;
            }
            case 'bar_bars': case 'bar_smooth': {
                const barWidth = width / barCount;
                if (this.settings.type === 'bar_smooth') { this.ctx.beginPath(); this.ctx.moveTo(0, height); }
                for (let i = 0; i < barCount; i++) {
                    const barHeight = Math.pow(this.dataArray[i] / 255, this.settings.sensitivity) * height * 0.9 * this.settings.size;
                    const x = i * barWidth; const y = height - barHeight;
                    if (this.settings.type === 'bar_bars') { this.ctx.fillRect(x, y, barWidth, barHeight); } 
                    else { this.ctx.lineTo(x, y); }
                }
                if (this.settings.type === 'bar_smooth') { this.ctx.lineTo(width, height); this.ctx.stroke(); }
                break;
            }
            case 'linear_mirror_bars': case 'linear_mirror_smooth': {
                const barWidth = width / barCount;
                if (this.settings.type === 'linear_mirror_smooth') this.ctx.beginPath();
                for (let i = 0; i < barCount; i++) {
                    const barHeight = Math.pow(this.dataArray[i] / 255, this.settings.sensitivity) * height * 0.8 * this.settings.size;
                    const x = centerX + ((i - barCount / 2) * barWidth); const y = centerY - barHeight / 2;
                    if (this.settings.type === 'linear_mirror_bars') { this.ctx.fillRect(x, y, barWidth, barHeight); } 
                    else { const smoothX = centerX + ((i - barCount / 2) * barWidth); i === 0 ? this.ctx.moveTo(smoothX, centerY - barHeight / 2) : this.ctx.lineTo(smoothX, centerY - barHeight / 2); }
                }
                if (this.settings.type === 'linear_mirror_smooth') {
                    for (let i = barCount - 1; i >= 0; i--) {
                        const barHeight = Math.pow(this.dataArray[i] / 255, this.settings.sensitivity) * height * 0.8 * this.settings.size;
                        this.ctx.lineTo(centerX + ((i - barCount / 2) * barWidth), centerY + barHeight / 2);
                    }
                    this.ctx.closePath(); this.ctx.stroke();
                }
                break;
            }
            case 'monstercat': {
                const barCount = 128; const barWidth = width / barCount;
                for (let i = 0; i < barCount; i++) {
                    const dataIndex = Math.floor(i * (this.bufferLength / barCount));
                    let barHeight = Math.pow(this.dataArray[dataIndex] / 255, this.settings.sensitivity) * height * 0.7 * this.settings.size;
                    barHeight = Math.max(1, barHeight);
                    const x = centerX + ((i - barCount / 2) * barWidth); const y = centerY - barHeight / 2;
                    this.ctx.fillRect(x, y, barWidth, barHeight);
                    if (i < 10 && this.dataArray[dataIndex] > 200) { this.spawnParticles(x, centerY, 5); }
                }
                break;
            }
        }
    }
    
    spawnParticles(x, y, amount) {
        for (let i = 0; i < amount; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
                life: 1, alpha: 1
            });
        }
    }

    updateAndDrawParticles(width, height) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
                this.particles.splice(i, 1);
            } else {
                this.ctx.globalAlpha = p.life;
                this.ctx.fillRect(p.x, p.y, 2, 2);
                this.ctx.globalAlpha = 1;
            }
        }
    }
}