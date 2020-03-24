import { Event } from './event';
import { User } from '../models/user';
import { Playlist } from '../models/playlist';

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
  public playlist: Playlist

  constructor(playlist: Playlist) {
    this.playlist = playlist;
  }
}
