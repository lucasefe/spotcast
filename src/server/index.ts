import express from "express";
import * as http from "http";
import SocketIO from "socket.io";
import * as events from "events"
import * as uuid from 'uuid';
import { UserConnectedEvent } from '../events';
import { User } from '../models/user';


class Server {
  private sockets: SocketIO.Server;
  private httpServer: http.Server;
  private app: Express.Application;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app) as http.Server;
    this.sockets = SocketIO(this.httpServer) as SocketIO.Server;

    this.sockets.on("connection", socket => {
      const user = new User();
      const event = new UserConnectedEvent(user)
      socket.emit(UserConnectedEvent.eventName, event);
    });
  }

  async listen(port: Number) {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(port)
      this.httpServer
        .on('listening', () => resolve(this.httpServer))
        .on('error', reject);
    })
  }

  async stop() {
    this.httpServer.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export default Server;
