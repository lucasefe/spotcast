import SocketIOClient from 'socket.io-client';
import Playlist from './playlist';
import * as ServerEvents from '../server/events';
import * as ClientEvents from './events';
import * as events from 'events';

class Client extends events.EventEmitter {
  public userId: string | null;
  private socket: SocketIOClient.Socket | null;
  private url: string;

  constructor(url: string) {
    super();

    this.url = url;
    this.socket = null;
    this.userId = null;
  }

  async connect(): Promise<void> {
    return new Promise<void>(resolve => {
      this.socket = SocketIOClient(this.url, { autoConnect: false });

      this.socket.on(ServerEvents.UserConnectedEvent.eventName, (data: ServerEvents.UserConnectedEvent) => {
        if (this.userId && this.userId !== data.userId)
          this.emit(ClientEvents.UserConnectedEvent.eventName, data);
        else {
          this.userId = data.userId;
          this.emit(ClientEvents.ConnectedEvent.eventName, data);
        }
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
          const playlist = data.playlist;
          resolve(playlist);
        } else reject();
      });

      this.socket.emit(ServerEvents.PlaylistRequestedEvent.eventName);
    });
  }
}

export default Client;
