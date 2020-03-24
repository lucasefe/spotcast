import Track from './track';

export default class Playlist {
  public tracks: Array<Track>

  constructor() {
    this.tracks = new Array<Track>();
  }

  add(track: Track): void {
    const alreadyExists = this.tracks.find(t => t.id === track.id);
    if (!alreadyExists)
      this.tracks.push(track);
  }

  remove(track: Track): void {
    const index = this.tracks.findIndex(t => t.id === track.id);
    if (index !== -1)
      this.tracks.splice(index, 1);
  }

  clear(): void {
    this.tracks.splice(0);
  }
}
