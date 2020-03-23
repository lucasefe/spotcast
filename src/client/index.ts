import SocketIOClient from "socket.io-client";
import { UserConnectedEvent } from "../events";
import * as events from "events";

enum Statuses {
  connected = "Connected",
  disconnected = "Disconnected"
}

class Client extends events.EventEmitter {
  public userId: string | null;
  public status: Statuses;
  private socket: SocketIOClient.Socket | null;
  private url: string;

  constructor(url: string, done: () => {}) {
    super();

    this.url = url;
    this.status = Statuses.disconnected;
    this.socket = null;
    this.userId = null;
  }

  async connect() {
    return new Promise(resolve => {
      this.socket = SocketIOClient(this.url);
      this.socket.on(
        UserConnectedEvent.eventName,
        (data: UserConnectedEvent) => {
          this.status = Statuses.connected;

          if (this.userId && this.userId !== data.userId) {
            this.emit("user-connected", data);
          } else {
            this.userId = data.userId;
            this.emit("connected", data);
          }
          resolve();
        }
      );
    });
  }
}

export default Client;
