import * as ClientEvents  from './events';
import * as events        from 'events';
import * as ServerActions from '../server/actions';
import * as ServerEvents  from '../server/events';
import Playlist           from './playlist';
import SocketIOClient     from 'socket.io-client';

class Client extends events.EventEmitter {
  public userID: string | null;
  private socket: SocketIOClient.Socket | null;
  private url: string;

  constructor(url: string) {
    super();

    this.url = url;
    this.socket = null;
    this.userID = null;
  }

  async connect(): Promise<void> {
    return new Promise<void>(resolve => {
      this.socket = SocketIOClient(this.url, { autoConnect: false });

      this.socket.on(ServerEvents.UserConnectedEvent.eventName, (data: ServerEvents.UserConnectedEvent) => {
        if (this.userID && this.userID !== data.userID)
          this.emit(ClientEvents.UserConnectedEvent.eventName, data);
        else {
          this.userID = data.userID;
          this.emit(ClientEvents.ConnectedEvent.eventName, data);
        }
      });

      this.socket.on(ServerEvents.PlaylistUpdatedEvent.eventName, (data: ServerEvents.PlaylistUpdatedEvent) => {
        this.emit(ClientEvents.PlaylistUpdatedEvent.eventName, data);
      });

      this.socket.on('connect', () => resolve());
      this.socket.open();
    });
  }

  async disconnect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.socket) {
        this.socket.on('disconnect', () => {
          resolve();
        });
        this.socket.close();
      } else reject();
    });
  }

  async getPlaylist(): Promise<Playlist> {
    return new Promise<Playlist>((resolve, reject) => {
      if (!this.socket)
        throw new Error('disconnected!');

      this.socket.once(ServerEvents.PlaylistRequestedEvent.eventName, (data: ServerEvents.PlaylistRequestedEvent) => {
        if (data.playlist) {
          const playlist = new Playlist(data);
          resolve(playlist);
        } else reject();
      });

      this.socket.emit(ServerEvents.PlaylistRequestedEvent.eventName);
    });
  }

  async addTrackToPlaylist(trackID: string): Promise<Playlist> {
    return new Promise<Playlist>((resolve, reject) => {
      if (!this.socket)
        throw new Error('disconnected!');

      this.socket.emit(ServerActions.AddTrackToPlaylistAction.actionName, { trackID }, (ack: boolean) => {
        if (ack === true)
          resolve();
        else
          reject();
      });
    });
  }

  async removeTrackFromPlaylist(trackID: string): Promise<Playlist> {
    return new Promise<Playlist>((resolve, reject) => {
      if (!this.socket)
        throw new Error('disconnected!');

      this.socket.emit(ServerActions.RemoveTrackFromPlaylistAction.actionName, { trackID }, (ack: boolean) => {
        if (ack === true)
          resolve();
        else
          reject();
      });
    });
  }
}

export default Client;
