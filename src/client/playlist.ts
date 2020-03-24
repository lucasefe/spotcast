import * as ServerEvents from '../server/events';

export default class Playlist {
  constructor(data: ServerEvents.PlaylistRequestedEvent) {
    console.log({ data });
  }
}
