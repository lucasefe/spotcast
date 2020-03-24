export class Playlist {
  public tracks: Array<string>

  constructor() {
    this.tracks = new Array<string>();
  }

  add(trackID: string): void {
    this.tracks.push(trackID);
  }
}
