class Playlist {
    constructor(onSongSelect) {
        this.playlist = [];
        this.currentSongIndex = -1;
        this.onSongSelect = onSongSelect;
        this.playlistEl = document.getElementById('playlist');
        this.draggedItem = null;
        document.getElementById('upload-btn').addEventListener('click', () => document.getElementById('song-upload').click());
        document.getElementById('upload-folder-btn').addEventListener('click', () => document.getElementById('folder-upload').click());
        document.getElementById('song-upload').addEventListener('change', (e) => this.handleFiles(e.target.files));
        document.getElementById('folder-upload').addEventListener('change', (e) => this.handleFiles(e.target.files));
        this.playlistEl.addEventListener('dragstart', (e) => { this.draggedItem = e.target.closest('li'); });
        this.playlistEl.addEventListener('dragover', (e) => { e.preventDefault(); const target = e.target.closest('li'); if(target && target !== this.draggedItem) target.parentNode.insertBefore(this.draggedItem, target); });
        this.playlistEl.addEventListener('drop', () => { this.updatePlaylistOrder(); this.draggedItem = null; });
    }
    async handleFiles(files) {
        const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));
        for (const file of audioFiles) {
            const tags = await this.readTags(file);
            this.playlist.push({ file, ...tags });
        }
        if (this.playlist.length > 0 && this.currentSongIndex === -1) {
            this.selectSong(0);
        }
        this.render();
    }
    readTags(file) {
        return new Promise(resolve => {
            window.jsmediatags.read(file, {
                onSuccess: (tag) => resolve(tag.tags),
                onError: () => resolve({ title: file.name.replace(/\.[^/.]+$/, "") })
            });
        });
    }
    selectSong(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentSongIndex = index;
        this.onSongSelect(this.playlist[this.currentSongIndex]);
        this.render();
    }
    render() {
        this.playlistEl.innerHTML = '';
        this.playlist.forEach((song, index) => {
            const li = document.createElement('li');
            li.className = index === this.currentSongIndex ? 'active' : '';
            li.dataset.index = index;
            li.draggable = true;
            li.innerHTML = `<i class="fas fa-grip-vertical drag-handle"></i><span class="song-title-playlist">${song.title || song.file.name}</span><i class="fas fa-times remove-song-btn"></i>`;
            li.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-song-btn')) {
                    this.removeSong(index);
                } else {
                    this.selectSong(index);
                }
            });
            this.playlistEl.appendChild(li);
        });
    }
    removeSong(index) {
        this.playlist.splice(index, 1);
        if(this.currentSongIndex >= index) {
            this.currentSongIndex--;
        }
        this.render();
    }
    updatePlaylistOrder() {
        const newPlaylist = [];
        this.playlistEl.querySelectorAll('li').forEach(li => {
            newPlaylist.push(this.playlist[parseInt(li.dataset.index)]);
        });
        this.playlist = newPlaylist;
        this.currentSongIndex = this.playlist.findIndex(song => song.file.name === this.playlist[this.currentSongIndex].file.name);
        this.render();
    }
    next() { this.selectSong((this.currentSongIndex + 1) % this.playlist.length); }
    prev() { this.selectSong((this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length); }
}
