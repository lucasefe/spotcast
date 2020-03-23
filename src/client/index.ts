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
    return new Promise(resolve => {
      this.socket = SocketIOClient(this.url);

      this.socket.on(ServerEvents.UserConnectedEvent.eventName,
        (data: ServerEvents.UserConnectedEvent) => {
          if (this.userId && this.userId !== data.userId)
            this.emit(ClientEvents.UserConnectedEvent.eventName, data);
          else {
            this.userId = data.userId;
            this.emit(ClientEvents.ConnectedEvent.eventName, data);
          }
          resolve();
        }
      );
    });
  }
}

export default Client;
