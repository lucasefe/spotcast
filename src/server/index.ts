import express from "express";
import * as http from "http";
import SocketIO from "socket.io";

class Server {
  private sockets: SocketIO.Server;
  private httpServer: http.Server;
  private app: Express.Application;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app) as http.Server;
    this.sockets = SocketIO(this.httpServer) as SocketIO.Server;

    this.sockets.on("connection", socket => {
      socket.emit("hola");
    });
  }

  async listen(port: Number) {
    return new Promise((resolve) => {
      this.httpServer.listen(port, resolve)
    })
  }
}

export default Server;
