import Playlist from './models/playlist';

export class Action {
  static readonly AddTrackToPlaylistAction = 'add-track-to-playlist';
  static readonly RemoveTrackFromPlaylistAction = 'remove-track-to-playlist';
  static readonly ClearPlaylist = 'clear-playlist';
}

export class AddTrackToPlaylistAction {
  static readonly actionName: string = Action.AddTrackToPlaylistAction;
  public playlist: Playlist;

  constructor(playlist: Playlist) {
    this.playlist = playlist;
  }
}

export class RemoveTrackFromPlaylistAction {
  static readonly actionName: string = Action.RemoveTrackFromPlaylistAction;

  public trackID: string;

  constructor(trackID: string) {
    this.trackID = trackID;
  }
}


export class ClearPlaylist {
  static readonly actionName: string = Action.ClearPlaylist;
}
