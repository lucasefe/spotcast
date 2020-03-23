import SocketIOClient from "socket.io-client";

class Client{
  private socket: SocketIOClient.Socket;
  status: string;

  constructor(url: string, done: () => {}) {
    this.status = 'disconencted' // should be an enum
    this.socket = SocketIOClient(url)
    this.socket.on('connect', () => {
      this.status = 'connected'
      done()
    });
  }
}

export default Client;
