import Track from './track';

export default class Playlist {
  public tracks: Array<Track>

  constructor() {
    this.tracks = new Array<Track>();
  }

  add(track: Track): void {
    this.tracks.push(track);
  }
}
