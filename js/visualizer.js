class Visualizer {
    constructor(canvas, centerImage) {
        this.canvas = canvas;
        this.centerImage = centerImage;
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.isPlaying = false;
        this.settings = { type: 'monstercat', fillType: 'image', customColor: '#1A1A1A', spectrumColor: '#FFFFFF', backgroundColor: '#000000', smoothing: 0.8, barCount: 256, sensitivity: 2.5, size: 1.0 };
        document.getElementById('visualizer-wrapper').style.backgroundColor = this.settings.backgroundColor;
    }

    connect(audioElement) {
        if (this.audioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.source = this.audioContext.createMediaElementSource(audioElement);
        // The source will be connected to the equalizer first, then to the analyser
    }

    updateAnalyserSettings() {
        if (!this.analyser) return;
        this.analyser.smoothingTimeConstant = this.settings.smoothing;
        this.analyser.fftSize = this.settings.type === 'monstercat' ? 2048 : this.settings.barCount * 2;
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
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
                this.ctx.fillStyle = this.settings.fillType === 'spectrum_color' ? this.settings.spectrumColor : this.settings.customColor;
                this.ctx.fill();
            }
        } else {
             this.centerImage.style.width = '0px';
             this.centerImage.style.height = '0px';
        }

        switch (this.settings.type) {
            case 'ring_bars': {
                const radius = baseRadius * 1.1;
                const barWidth = 3; 
                this.ctx.lineWidth = barWidth;
                for (let i = 0; i < this.settings.barCount; i++) {
                    const barHeight = Math.pow(this.dataArray[i] / 255, this.settings.sensitivity) * height * 0.2;
                    const angle = (i / this.settings.barCount) * 2 * Math.PI;
                    const x1 = centerX + Math.cos(angle) * radius;
                    const y1 = centerY + Math.sin(angle) * radius;
                    const x2 = centerX + Math.cos(angle) * (radius + barHeight);
                    const y2 = centerY + Math.sin(angle) * (radius + barHeight);
                    this.ctx.beginPath();
                    this.ctx.moveTo(x1, y1);
                    this.ctx.lineTo(x2, y2);
                    this.ctx.stroke();
                }
                break;
            }
            case 'monstercat': {
                const barCount = 64;
                const barWidth = width / barCount * 0.7;
                const barSpacing = width / barCount * 0.3;
                let x = centerX - (width / 2);
                for (let i = 0; i < barCount; i++) {
                    const dataIndex = Math.floor(i * (this.bufferLength / barCount));
                    let barHeight = Math.pow(this.dataArray[dataIndex] / 255, this.settings.sensitivity) * height * 0.9;
                    barHeight = Math.max(2, barHeight);
                    this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                    x += barWidth + barSpacing;
                }
                break;
            }
            // Other cases for bar, linear mirror, etc. would go here
        }
    }
}