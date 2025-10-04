document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio');
    const visualizer = new Visualizer(document.getElementById('spectrum-canvas'), document.getElementById('center-image'));
    let equalizer;
    let tempSettings = {};
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
        audio.play();
        visualizer.isPlaying = true;
        UI.setPlayPause(true);
    }
    function pause() {
        audio.pause();
        visualizer.isPlaying = false;
        UI.setPlayPause(false);
    }
    document.getElementById('play-pause-btn').addEventListener('click', () => (visualizer.isPlaying ? pause() : play()));
    document.getElementById('next-btn').addEventListener('click', () => playlist.next());
    document.getElementById('prev-btn').addEventListener('click', () => playlist.prev());
    document.getElementById('rewind-btn').addEventListener('click', () => audio.currentTime -= 10);
    document.getElementById('forward-btn').addEventListener('click', () => audio.currentTime += 10);
    audio.addEventListener('ended', () => playlist.next());
    audio.addEventListener('timeupdate', () => UI.updateProgressBar(audio));
    document.querySelector('.progress-bar-wrapper').addEventListener('click', function(e) { if(audio.duration) audio.currentTime = (e.offsetX / this.clientWidth) * audio.duration; });
    let lastVolume = 1;
    document.getElementById('volume-slider').addEventListener('input', e => audio.volume = e.target.value);
    document.getElementById('volume-btn').addEventListener('click', () => {
        if (audio.volume > 0) { lastVolume = audio.volume; audio.volume = 0; document.getElementById('volume-slider').value = 0; } 
        else { audio.volume = lastVolume; document.getElementById('volume-slider').value = lastVolume; }
    });
    document.querySelectorAll('[id$="-btn"]').forEach(btn => { const modal = document.getElementById(btn.id.replace('-btn', '-modal')); if (modal) btn.addEventListener('click', () => { if(modal.id === 'settings-modal') { tempSettings = {...visualizer.settings}; } modal.style.display = 'block'; }); });
    document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none'));
    document.getElementById('fullscreen-btn').addEventListener('click', () => document.getElementById('player-container').requestFullscreen());
    document.getElementById('hide-controls-btn').addEventListener('click', () => { document.getElementById('controls-area').classList.add('hidden'); document.getElementById('show-controls-btn').hidden = false; });
    document.getElementById('show-controls-btn').addEventListener('click', () => { document.getElementById('controls-area').classList.remove('hidden'); document.getElementById('show-controls-btn').hidden = true; });
    document.querySelectorAll('#settings-modal input, #settings-modal select').forEach(el => {
        el.addEventListener('change', e => {
            const key = e.target.id.replace(/-/g, '_');
            const value = e.target.type === 'range' ? parseFloat(e.target.value) : e.target.value;
            tempSettings[key] = value;
            if (key === 'center_fill_type') { document.getElementById('custom-color-setting').hidden = e.target.value !== 'custom_color'; }
        });
    });
    document.getElementById('apply-settings-btn').addEventListener('click', () => {
        visualizer.applySettings(tempSettings);
        document.getElementById('settings-modal').style.display = 'none';
    });
});