import SocketIOClient from "socket.io-client";

enum Statuses {
  connected = "Connected",
  disconnected = "Disconnected"
}

class Client{
  private socket: SocketIOClient.Socket;
  status: Statuses;

  constructor(url: string, done: () => {}) {
    this.status = Statuses.disconnected;
    this.socket = SocketIOClient(url)
    this.socket.on('connect', () => {
      this.status = Statuses.connected;
      done()
    });
  }
}

export default Client;
