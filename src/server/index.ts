import express from 'express';
import * as http from 'http';
import SocketIO from 'socket.io';
import { UserConnectedEvent } from './events';
import { UserDisconnectedEvent } from './events';
import { PlaylistRequestedEvent } from './events';
import { User } from './models/user';
import { Playlist } from './models/playlist';


class Server {
  private sockets: SocketIO.Server;
  private users: Map<string, User>;

  constructor(httpServer: http.Server) {
    this.sockets = SocketIO(httpServer) as SocketIO.Server;
    this.users = new Map<string, User>();

    this.sockets.on('connection', socket => {
      const user = this.connectUser(socket);
      socket.on('disconnect', () => {
        this.disconnectUser(socket);
        this.sockets.emit(UserDisconnectedEvent.eventName, new UserDisconnectedEvent(user));
      });

      socket.on(PlaylistRequestedEvent.eventName, () => {
        socket.emit(PlaylistRequestedEvent.eventName, new PlaylistRequestedEvent(new Playlist()));
      });

      const event = new UserConnectedEvent(user);
      this.sockets.emit(UserConnectedEvent.eventName, event);
    });
  }

  private connectUser(socket: SocketIO.Socket): User {
    const user = new User(socket);
    this.users.set(socket.id, user);
    return user;
  }

  private disconnectUser(socket: SocketIO.Socket): void {
    this.users.delete(socket.id);
  }
}

export default Server;
