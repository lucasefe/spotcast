import SocketIOClient from "socket.io-client";

enum Statuses {
  connected = "Connected",
  disconnected = "Disconnected"
}

class Client {
  public status: Statuses;
  private socket: SocketIOClient.Socket | null;
  private url: string;

  constructor(url: string, done: () => {}) {
    this.url = url;
    this.status = Statuses.disconnected;
    this.socket = null;
  }

  async connect() {
    return new Promise((resolve) => {
      this.socket = SocketIOClient(this.url);
      this.socket.on("connect", () => {
        this.status = Statuses.connected;
        resolve();
      });
    });
  }
}

export default Client;
