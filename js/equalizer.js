class Equalizer {
    constructor(audioContext, sourceNode) {
        this.audioContext = audioContext;
        this.sourceNode = sourceNode;
        this.bands = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
        this.filters = [];
        this.presets = {
            flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            rock: [5, 3, -2, -3, -1, 2, 4, 5, 6, 6],
            pop: [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2],
            classical: [5, 4, 3, 2, -2, -2, 0, 2, 3, 4],
            dance: [6, 5, 2, 0, -2, -3, 0, 2, 4, 5],
        };
        this.createFilters();
        this.connectFilters();
        this.createUI();
    }

    createFilters() {
        this.filters = this.bands.map(freq => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.41;
            filter.gain.value = 0;
            return filter;
        });
    }

    connectFilters() {
        let currentNode = this.sourceNode;
        this.filters.forEach(filter => {
            currentNode.connect(filter);
            currentNode = filter;
        });
        this.lastNode = currentNode;
    }

    createUI() {
        const container = document.getElementById('equalizer-bands');
        container.innerHTML = '';
        this.filters.forEach((filter, i) => {
            const bandDiv = document.createElement('div');
            bandDiv.className = 'band';
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = -12;
            slider.max = 12;
            slider.step = 0.1;
            slider.value = filter.gain.value;
            slider.orient = 'vertical';
            slider.addEventListener('input', (e) => filter.gain.value = e.target.value);

            const label = document.createElement('label');
            label.textContent = this.bands[i] < 1000 ? `${this.bands[i]}` : `${this.bands[i] / 1000}k`;
            
            bandDiv.appendChild(slider);
            bandDiv.appendChild(label);
            container.appendChild(bandDiv);
        });

        document.getElementById('eq-presets').addEventListener('change', (e) => {
            this.applyPreset(e.target.value);
        });
    }
    
    applyPreset(presetName) {
        const values = this.presets[presetName];
        if (!values) return;
        const sliders = document.querySelectorAll('#equalizer-bands input[type=range]');
        this.filters.forEach((filter, i) => {
            filter.gain.value = values[i];
            sliders[i].value = values[i];
        });
    }
}