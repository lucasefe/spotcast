import { Playlist } from './models/playlist';
import { User }     from './models/user';

export class Event {
  static readonly UserConnected = 'user-connected';
  static readonly UserDisconnected = 'user-disconnected';
  static readonly PlaylistRequested = 'playlist-requested';
  static readonly PlaylistUpdatedEvent = 'playlist-updated';
}

export class UserConnectedEvent {
  static readonly eventName: string = Event.UserConnected;
  public userId: string;

  constructor(user: User) {
    this.userId = user.userId;
  }
}

export class UserDisconnectedEvent {
  static readonly eventName: string = Event.UserDisconnected;
  public userId: string;

  constructor(user: User) {
    this.userId = user.userId;
  }
}

export class PlaylistRequestedEvent {
  static readonly eventName: string = Event.PlaylistRequested;
  public playlist: Playlist;

  constructor(playlist: Playlist) {
    this.playlist = playlist;
  }
}

export class PlaylistUpdatedEvent {
  static readonly eventName: string = Event.PlaylistUpdatedEvent;
  public playlist: Playlist;

  constructor(playlist: Playlist) {
    this.playlist = playlist;
  }
}
