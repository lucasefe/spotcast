import SocketIOClient from "socket.io-client";
import { UserConnectedEvent } from '../events'
import * as events from 'events'

enum Statuses {
  connected = "Connected",
  disconnected = "Disconnected"
}

class Client extends events.EventEmitter { 

  public status: Statuses;
  private socket: SocketIOClient.Socket | null;
  private url: string;

  constructor(url: string, done: () => {}) {
    super();
    this.url = url;
    this.status = Statuses.disconnected;
    this.socket = null;
  }

  async connect() {
    return new Promise((resolve) => {
      this.socket = SocketIOClient(this.url);
      this.socket.on(UserConnectedEvent.eventName, (data: UserConnectedEvent) => {
        this.status = Statuses.connected;
        this.emit('connected', data)
        resolve();
      });
    });
  }
}

export default Client;
