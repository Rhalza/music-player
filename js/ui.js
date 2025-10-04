const UI = {
    updateSongInfo(song) {
        document.getElementById('song-title').textContent = song.title || 'Unknown Title';
        document.getElementById('song-artist').textContent = song.artist || 'Unknown Artist';
        if (song.picture) {
            const { data, format } = song.picture;
            let base64String = "";
            for (let i = 0; i < data.length; i++) {
                base64String += String.fromCharCode(data[i]);
            }
            document.getElementById('center-image').src = `data:${format};base64,${window.btoa(base64String)}`;
        } else {
            document.getElementById('center-image').src = 'rhalza.png';
        }
    },

    updateProgressBar(audio) {
        const { duration, currentTime } = audio;
        if (duration) {
            const progressPercent = (currentTime / duration) * 100;
            document.querySelector('.progress-bar').style.width = `${progressPercent}%`;
            
            const formatTime = (time) => {
                const minutes = Math.floor(time / 60);
                const seconds = Math.floor(time % 60).toString().padStart(2, '0');
                return `${minutes}:${seconds}`;
            };
            
            document.querySelector('.current-time').textContent = formatTime(currentTime);
            document.querySelector('.duration').textContent = formatTime(duration);
        }
    },
    
    setPlayPause(playing) {
        document.getElementById('play-pause-btn').classList.toggle('playing', playing);
    }
};