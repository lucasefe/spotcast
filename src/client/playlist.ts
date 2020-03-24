import * as ServerEvents from '../server/events';
import Track             from './track';

export default class Playlist {
  public tracks: Array<Track>
  constructor(data: ServerEvents.PlaylistRequestedEvent) {
    this.tracks = data.playlist.tracks;
  }
}

