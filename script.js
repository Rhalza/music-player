const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const rewindBtn = document.getElementById('rewind-btn');
const forwardBtn = document.getElementById('forward-btn');
const progressBar = document.querySelector('.progress');
const progressContainer = document.querySelector('.progress-bar');
const currentTimeEl = document.querySelector('.current-time');
const durationEl = document.querySelector('.duration');
const volumeBtn = document.getElementById('volume-btn');
const volumeSlider = document.getElementById('volume-slider');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const centerImage = document.getElementById('center-image');
const playlistBtn = document.getElementById('playlist-btn');
const lyricsBtn = document.getElementById('lyrics-btn');
const eqBtn = document.getElementById('eq-btn');
const settingsBtn = document.getElementById('settings-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const settingsModal = document.getElementById('settings-modal');
const playlistModal = document.getElementById('playlist-modal');
const lyricsModal = document.getElementById('lyrics-modal');
const eqModal = document.getElementById('eq-modal');
const closeBtns = document.querySelectorAll('.close-btn');
const songUpload = document.getElementById('song-upload');
const playlistEl = document.getElementById('playlist');
const canvas = document.getElementById('spectrum-canvas');
const ctx = canvas.getContext('2d');

let audioContext, analyser, source, dataArray, bufferLength;
let isPlaying = false;
let currentSongIndex = 0;
let playlist = [];

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 2048;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

function visualize() {
    requestAnimationFrame(visualize);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Visualization logic will go here
}

function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
    } else {
        if (!audioContext) {
            initAudio();
        }
        audio.play();
    }
    isPlaying = !isPlaying;
    playPauseBtn.parentElement.classList.toggle('playing', isPlaying);
}

function updateProgressBar(e) {
    const { duration, currentTime } = e.srcElement;
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

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

function changeVolume() {
    audio.volume = volumeSlider.value;
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
}

function handleFileUpload(e) {
    const files = e.target.files;
    for (const file of files) {
        window.jsmediatags.read(file, {
            onSuccess: (tag) => {
                const { title, artist, album, picture } = tag.tags;
                playlist.push({ file, title, artist, album, picture });
                renderPlaylist();
                if (playlist.length === 1) {
                    loadSong(playlist[0]);
                }
            },
            onError: (error) => {
                console.error(error);
            }
        });
    }
}

function renderPlaylist() {
    playlistEl.innerHTML = '';
    playlist.forEach((song, index) => {
        const li = document.createElement('li');
        li.textContent = song.title || song.file.name;
        li.addEventListener('click', () => {
            currentSongIndex = index;
            loadSong(playlist[currentSongIndex]);
            audio.play();
            isPlaying = true;
            playPauseBtn.parentElement.classList.add('playing');
        });
        playlistEl.appendChild(li);
    });
}

playPauseBtn.addEventListener('click', togglePlayPause);
audio.addEventListener('timeupdate', updateProgressBar);
progressContainer.addEventListener('click', setProgress);
volumeSlider.addEventListener('input', changeVolume);
songUpload.addEventListener('change', handleFileUpload);

[playlistBtn, lyricsBtn, eqBtn, settingsBtn].forEach((btn, index) => {
    btn.addEventListener('click', () => {
        [playlistModal, lyricsModal, eqModal, settingsModal][index].style.display = 'block';
    });
});

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        [playlistModal, lyricsModal, eqModal, settingsModal].forEach(modal => modal.style.display = 'none');
    });
});

window.addEventListener('click', (e) => {
    [playlistModal, lyricsModal, eqModal, settingsModal].forEach(modal => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

visualize();