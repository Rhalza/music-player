document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio');
    const visualizer = new Visualizer(document.getElementById('spectrum-canvas'), document.getElementById('center-image'));
    let equalizer; let tempSettings = {}; let loopState = 'none'; let lastVolume = 1;
    const settingsMap = { 'spectrum-type': 'type', 'center-fill-type': 'fillType', 'solid-color-picker': 'customColor', 'spectrum-color': 'spectrumColor', 'background-color': 'backgroundColor', 'smoothing': 'smoothing', 'bar-amount': 'barCount', 'sensitivity': 'sensitivity', 'size': 'size' };
    const playlist = new Playlist(song => { audio.src = URL.createObjectURL(song.file); UI.updateSongInfo(song); play(); });
    function initAudio() {
        visualizer.connect(audio);
        equalizer = new Equalizer(visualizer.audioContext, visualizer.source);
        equalizer.lastNode.connect(visualizer.analyser);
        visualizer.analyser.connect(visualizer.audioContext.destination);
        visualizer.updateAnalyserSettings();
        visualizer.renderFrame();
    }
    function play() {
        if (playlist.playlist.length === 0) return;
        if (!visualizer.audioContext) initAudio();
        audio.play().catch(e => console.error("Playback error:", e));
        visualizer.isPlaying = true;
        UI.setPlayPause(true);
    }
    function pause() {
        audio.pause(); visualizer.isPlaying = false; UI.setPlayPause(false);
    }
    function updateVolumeIcon(volume) {
        const volumeBtnIcon = document.querySelector('#volume-btn i');
        if (volume === 0) { volumeBtnIcon.className = 'fas fa-volume-mute'; }
        else if (volume < 0.5) { volumeBtnIcon.className = 'fas fa-volume-down'; }
        else { volumeBtnIcon.className = 'fas fa-volume-up'; }
    }
    document.getElementById('play-pause-btn').addEventListener('click', () => (visualizer.isPlaying ? pause() : play()));
    document.getElementById('next-btn').addEventListener('click', () => playlist.next());
    document.getElementById('prev-btn').addEventListener('click', () => playlist.prev());
    document.getElementById('rewind-btn').addEventListener('click', () => audio.currentTime -= 10);
    document.getElementById('forward-btn').addEventListener('click', () => audio.currentTime += 10);
    audio.addEventListener('ended', () => {
        if (loopState === 'all') { playlist.next(); }
        else if (loopState === 'none' && playlist.currentSongIndex < playlist.playlist.length - 1) { playlist.next(); }
        else if (loopState === 'none' && playlist.currentSongIndex >= playlist.playlist.length -1) { pause(); audio.currentTime = 0; }
    });
    audio.addEventListener('timeupdate', () => UI.updateProgressBar(audio));
    document.querySelector('.progress-bar-wrapper').addEventListener('click', function(e) { if(audio.duration) audio.currentTime = (e.offsetX / this.clientWidth) * audio.duration; });
    document.getElementById('volume-slider').addEventListener('input', e => { audio.volume = e.target.value; updateVolumeIcon(audio.volume); });
    document.getElementById('volume-btn').addEventListener('click', () => {
        if (audio.volume > 0) { lastVolume = audio.volume; audio.volume = 0; } 
        else { audio.volume = lastVolume; }
        document.getElementById('volume-slider').value = audio.volume;
        updateVolumeIcon(audio.volume);
    });
    document.getElementById('loop-btn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        if (loopState === 'none') { loopState = 'all'; btn.title = 'Loop: All'; btn.classList.add('loop-all'); audio.loop = false; }
        else if (loopState === 'all') { loopState = 'one'; btn.title = 'Loop: One'; btn.classList.remove('loop-all'); btn.classList.add('loop-one'); audio.loop = true; }
        else { loopState = 'none'; btn.title = 'Loop: Off'; btn.classList.remove('loop-one'); audio.loop = false; }
    });
    document.querySelectorAll('.control-btn[id$="-btn"]').forEach(btn => { const modal = document.getElementById(btn.id.replace('-btn', '-modal')); if (modal) btn.addEventListener('click', () => { if(modal.id === 'settings-modal') { tempSettings = {...visualizer.settings}; Object.entries(settingsMap).forEach(([id, key]) => {if(document.getElementById(id)) document.getElementById(id).value = visualizer.settings[key]; }); } modal.style.display = 'block'; }); });
    document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none'));
    document.getElementById('fullscreen-btn').addEventListener('click', () => document.getElementById('player-container').requestFullscreen());
    document.querySelectorAll('#settings-modal input, #settings-modal select').forEach(el => {
        el.addEventListener('change', e => {
            const key = settingsMap[e.target.id]; if (!key) return;
            const value = e.target.type.includes('range') ? parseFloat(e.target.value) : e.target.value;
            tempSettings[key] = value;
            if (key === 'fillType') { document.getElementById('custom-color-setting').hidden = e.target.value !== 'custom_color'; }
        });
    });
    document.getElementById('apply-settings-btn').addEventListener('click', () => {
        visualizer.applySettings(tempSettings);
        document.getElementById('settings-modal').style.display = 'none';
    });
});
