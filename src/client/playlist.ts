import * as ServerEvents from '../server/events';

export default class Playlist {
  public items: Array<string>
  constructor(data: ServerEvents.PlaylistRequestedEvent) {
    this.items = data.playlist.items;
  }
}
