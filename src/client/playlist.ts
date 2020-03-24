import * as ServerEvents from '../server/events';

export default class Playlist {
  public tracks: Array<string>
  constructor(data: ServerEvents.PlaylistRequestedEvent) {
    this.tracks = data.playlist.tracks;
  }
}
