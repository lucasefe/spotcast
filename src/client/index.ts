import SocketIOClient from "socket.io-client";
import * as ServerEvents from "../server/events";
import * as ClientEvents from "./events";
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

  constructor(url: string) {
    super();

    this.url = url;
    this.status = Statuses.disconnected;
    this.socket = null;
    this.userId = null;
  }

  async connect(): Promise<void> {
    return new Promise(resolve => {
      this.socket = SocketIOClient(this.url);

      this.socket.on(ServerEvents.UserConnectedEvent.eventName,
        (data: ServerEvents.UserConnectedEvent) => {
          this.status = Statuses.connected;

          if (this.userId && this.userId !== data.userId) {
            this.emit(ClientEvents.UserConnectedEvent.eventName, data);
          } else {
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
