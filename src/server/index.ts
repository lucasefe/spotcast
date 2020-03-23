import express from "express";
import * as http from "http";
import SocketIO from "socket.io";
import { UserConnectedEvent } from './events';
import { User } from './models/user';


class Server {
  private sockets: SocketIO.Server;
  private httpServer: http.Server;
  private app: Express.Application;
  private users: Array<User>;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app) as http.Server;
    this.sockets = SocketIO(this.httpServer) as SocketIO.Server;
    this.users = [];

    this.sockets.on("connection", (socket) => {
      const user = new User(socket);
      this.users.push(user);
      const event = new UserConnectedEvent(user)
      this.sockets.emit(UserConnectedEvent.eventName, event);
    });
  }

  async listen(port: number): Promise<http.Server> {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(port)
      this.httpServer
        .on('listening', () => resolve(this.httpServer))
        .on('error', reject);
    })
  }

  async stop(): Promise<void> {
    this.httpServer.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export default Server;
