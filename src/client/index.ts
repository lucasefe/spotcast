import SocketIOClient from 'socket.io-client';
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

      this.socket.on(
        ServerEvents.UserConnectedEvent.eventName,
        (data: ServerEvents.UserConnectedEvent) => {
          if (this.userId && this.userId !== data.userId)
            this.emit(ClientEvents.UserConnectedEvent.eventName, data);
          else {
            this.userId = data.userId;
            this.emit(ClientEvents.ConnectedEvent.eventName, data);
          }
        }
      );

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
}

export default Client;
