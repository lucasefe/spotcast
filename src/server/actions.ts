import Playlist from './models/playlist';

export class Action {
  static readonly AddTrackToPlaylistAction = 'add-track-to-playlist';
}

export class AddTrackToPlaylistAction {
  static readonly actionName: string = Action.AddTrackToPlaylistAction;
  public playlist: Playlist;

  constructor(playlist: Playlist) {
    this.playlist = playlist;
  }
}
