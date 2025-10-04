document.addEventListener('DOMContentLoaded', () => {
    const playerContainer = document.getElementById('player-container');
    const audio = document.getElementById('audio');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const rewindBtn = document.getElementById('rewind-btn');
    const forwardBtn = document.getElementById('forward-btn');
    
    const progressBar = document.querySelector('.progress-bar');
    const progressBarWrapper = document.querySelector('.progress-bar-wrapper');
    const currentTimeEl = document.querySelector('.current-time');
    const durationEl = document.querySelector('.duration');
    
    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    
    const songTitle = document.getElementById('song-title');
    const songArtist = document.getElementById('song-artist');
    const centerImage = document.getElementById('center-image');
    
    const playlistBtn = document.getElementById('playlist-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    const settingsModal = document.getElementById('settings-modal');
    const playlistModal = document.getElementById('playlist-modal');
    
    const closeBtns = document.querySelectorAll('.close-btn');
    
    const uploadBtn = document.getElementById('upload-btn');
    const songUpload = document.getElementById('song-upload');
    const playlistEl = document.getElementById('playlist');
    
    const canvas = document.getElementById('spectrum-canvas');
    const ctx = canvas.getContext('2d');

    let audioContext, analyser, source, dataArray, bufferLength;
    let isPlaying = false;
    let currentSongIndex = 0;
    let playlist = [];
    let lastVolume = 1;

    const settings = {
        type: 'ring_bars',
        fillType: 'image',
        customColor: '#1A1A1A',
        spectrumColor: '#FFFFFF',
        smoothing: 0.5,
        barCount: 256,
        sensitivity: 1.5,
        size: 1.0
    };

    function initAudio() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        updateAnalyser();
        renderFrame();
    }

    function updateAnalyser() {
        analyser.fftSize = settings.barCount * 2;
        analyser.smoothingTimeConstant = settings.smoothing;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }

    function loadSong(song) {
        songTitle.textContent = song.title || 'Unknown Title';
        songArtist.textContent = song.artist || 'Unknown Artist';
        audio.src = URL.createObjectURL(song.file);

        if (song.picture) {
            const { data, format } = song.picture;
            let base64String = "";
            for (let i = 0; i < data.length; i++) {
                base64String += String.fromCharCode(data[i]);
            }
            centerImage.src = `data:${format};base64,${window.btoa(base64String)}`;
        } else {
            centerImage.src = 'rhalza.png';
        }
        updatePlaylistUI();
    }

    function playSong() {
        isPlaying = true;
        playPauseBtn.classList.add('playing');
        audio.play();
    }

    function pauseSong() {
        isPlaying = false;
        playPauseBtn.classList.remove('playing');
        audio.pause();
    }

    function togglePlayPause() {
        if (playlist.length === 0) return;
        if (!audioContext) initAudio();
        isPlaying ? pauseSong() : playSong();
    }
    
    function changeSong(direction) {
        if (playlist.length === 0) return;
        currentSongIndex = (currentSongIndex + direction + playlist.length) % playlist.length;
        loadSong(playlist[currentSongIndex]);
        playSong();
    }

    function updateProgressBar(e) {
        const { duration, currentTime } = e.srcElement;
        if (duration) {
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            
            const formatTime = (time) => {
                const minutes = Math.floor(time / 60);
                const seconds = Math.floor(time % 60).toString().padStart(2, '0');
                return `${minutes}:${seconds}`;
            };
            
            currentTimeEl.textContent = formatTime(currentTime);
            durationEl.textContent = formatTime(duration);
        }
    }

    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        if (duration) {
            audio.currentTime = (clickX / width) * duration;
        }
    }

    function handleFileUpload(e) {
        const files = Array.from(e.target.files);
        let loadedCount = 0;
        files.forEach(file => {
            window.jsmediatags.read(file, {
                onSuccess: (tag) => {
                    const { title, artist, album, picture } = tag.tags;
                    playlist.push({ file, title, artist, album, picture });
                },
                onError: (error) => {
                    console.error('jsmediatags error:', error);
                    playlist.push({ file, title: file.name.replace('.mp3', '') });
                },
                onComplete: () => {
                    loadedCount++;
                    if (loadedCount === files.length) {
                         renderPlaylist();
                         if (playlist.length > 0 && audio.src === "") {
                            currentSongIndex = 0;
                            loadSong(playlist[0]);
                         }
                    }
                }
            });
        });
    }

    function renderPlaylist() {
        playlistEl.innerHTML = '';
        playlist.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = song.title || song.file.name;
            li.dataset.index = index;
            li.addEventListener('click', () => {
                currentSongIndex = index;
                loadSong(playlist[currentSongIndex]);
                if (!audioContext) initAudio();
                playSong();
            });
            playlistEl.appendChild(li);
        });
        updatePlaylistUI();
    }

    function updatePlaylistUI() {
        const items = playlistEl.querySelectorAll('li');
        items.forEach((item, index) => {
            item.classList.toggle('active', index === currentSongIndex);
        });
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            playerContainer.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    function renderFrame() {
        requestAnimationFrame(renderFrame);
        if (!isPlaying || !analyser) return;

        analyser.getByteFrequencyData(dataArray);
        
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);

        const isRingType = settings.type.startsWith('ring');
        centerImage.classList.toggle('is-ring', isRingType);
        
        if (isRingType && settings.fillType !== 'image') {
             const radius = (Math.min(width, height) * 0.18) * settings.size;
             ctx.beginPath();
             ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
             ctx.fillStyle = settings.fillType === 'spectrum_color' ? settings.spectrumColor : settings.customColor;
             ctx.fill();
        }

        const barCount = settings.barCount;
        ctx.fillStyle = settings.spectrumColor;
        ctx.strokeStyle = settings.spectrumColor;
        
        switch (settings.type) {
            case 'ring_bars':
            case 'ring_smooth': {
                const radius = (Math.min(width, height) * 0.2) * settings.size;
                const barWidth = (2 * Math.PI * radius) / (barCount * 1.5);
                ctx.lineWidth = barWidth;
                if(settings.type === 'ring_smooth') ctx.beginPath();

                for (let i = 0; i < barCount; i++) {
                    const barHeight = Math.pow(dataArray[i] / 255, settings.sensitivity) * height * 0.25;
                    const angle = (i / barCount) * 2 * Math.PI;
                    const x1 = centerX + Math.cos(angle) * radius;
                    const y1 = centerY + Math.sin(angle) * radius;
                    const x2 = centerX + Math.cos(angle) * (radius + barHeight);
                    const y2 = centerY + Math.sin(angle) * (radius + barHeight);
                    
                    if(settings.type === 'ring_bars'){
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    } else {
                        i === 0 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2);
                    }
                }
                if(settings.type === 'ring_smooth') {
                    ctx.closePath();
                    ctx.stroke();
                }
                break;
            }
            case 'bar_bars':
            case 'bar_smooth':
            case 'monstercat':
            case 'linear_mirror_bars':
            case 'linear_mirror_smooth': {
                const isMirror = settings.type.startsWith('linear_mirror');
                const isMonstercat = settings.type === 'monstercat';
                let barWidth = (width / barCount);
                if (isMonstercat) barWidth = width / 64 * 0.7; // Monstercat has fewer, wider bars
                const effectiveBarCount = isMonstercat ? 64 : barCount;
                 if(settings.type.endsWith('_smooth')) ctx.beginPath();

                for (let i = 0; i < effectiveBarCount; i++) {
                    const dataIndex = Math.floor(i * (bufferLength / effectiveBarCount));
                    let barHeight = Math.pow(dataArray[dataIndex] / 255, settings.sensitivity) * height * 0.8;
                    barHeight *= settings.size;
                    
                    if (isMirror) {
                        const x = centerX + (i * barWidth) - (effectiveBarCount * barWidth / 2);
                        const y = centerY - barHeight / 2;
                        if(settings.type.endsWith('_bars')) {
                           ctx.fillRect(x, y, barWidth * 0.8, barHeight);
                        } else {
                            i === 0 ? ctx.moveTo(x, centerY-barHeight/2) : ctx.lineTo(x, centerY-barHeight/2);
                        }
                    } else {
                        const x = i * barWidth;
                        const y = height - barHeight;
                        if(settings.type.endsWith('_bars')) {
                            ctx.fillRect(x, y, barWidth * 0.9, barHeight);
                        } else {
                           i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x, y);
                        }
                    }
                }
                
                if(settings.type.endsWith('_smooth')) {
                   isMirror ? ctx.lineTo(centerX + (effectiveBarCount * barWidth / 2), centerY) : ctx.lineTo(width, height);
                   isMirror ? ctx.lineTo(centerX - (effectiveBarCount * barWidth / 2), centerY) : ctx.lineTo(0, height);
                   ctx.closePath();
                   ctx.stroke();
                }
                break;
            }
        }
    }

    // Event Listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', () => changeSong(-1));
    nextBtn.addEventListener('click', () => changeSong(1));
    rewindBtn.addEventListener('click', () => audio.currentTime -= 10);
    forwardBtn.addEventListener('click', () => audio.currentTime += 10);
    
    audio.addEventListener('timeupdate', updateProgressBar);
    audio.addEventListener('ended', () => changeSong(1));
    progressBarWrapper.addEventListener('click', setProgress);
    
    uploadBtn.addEventListener('click', () => songUpload.click());
    songUpload.addEventListener('change', handleFileUpload);
    
    volumeSlider.addEventListener('input', (e) => audio.volume = e.target.value);
    volumeBtn.addEventListener('click', () => {
        if (audio.volume > 0) {
            lastVolume = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
        } else {
            audio.volume = lastVolume;
            volumeSlider.value = lastVolume;
        }
    });
    
    [playlistBtn, settingsBtn].forEach((btn, index) => {
        btn.addEventListener('click', () => {
            [playlistModal, settingsModal][index].style.display = 'block';
        });
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
    });
    
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Settings listeners
    document.getElementById('spectrum-type').addEventListener('change', (e) => settings.type = e.target.value);
    document.getElementById('center-fill-type').addEventListener('change', (e) => {
        settings.fillType = e.target.value;
        document.getElementById('custom-color-setting').style.display = e.target.value === 'custom_color' ? 'flex' : 'none';
    });
    document.getElementById('solid-color-picker').addEventListener('input', (e) => settings.customColor = e.target.value);
    document.getElementById('spectrum-color').addEventListener('input', (e) => settings.spectrumColor = e.target.value);
    document.getElementById('smoothing').addEventListener('input', (e) => {
        settings.smoothing = parseFloat(e.target.value);
        analyser.smoothingTimeConstant = settings.smoothing;
    });
    document.getElementById('bar-amount').addEventListener('input', (e) => {
        settings.barCount = parseInt(e.target.value);
        updateAnalyser();
    });
    document.getElementById('sensitivity').addEventListener('input', (e) => settings.sensitivity = parseFloat(e.target.value));
    document.getElementById('size').addEventListener('input', (e) => settings.size = parseFloat(e.target.value));
});