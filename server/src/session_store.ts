import * as spotify from './spotify';
import sio          from 'socket.io';


export interface Session {
  socket: sio.Socket;
  username: string;
  name: string;
  room?: string;
  currentPlayer?: spotify.CurrentPlayer;

  isConnected: boolean;
  canPlay: boolean;
}


export default class SessionStore {
  private sessions: Map<string, Session>

  constructor() {
    this.sessions = new Map<string, Session>();
  }

  getSession(socket: sio.Socket|string): Session| undefined {
    const socketId   = typeof socket === 'string' ? socket : socket.id;
    const sioSession = this.sessions.get(socketId);
    return sioSession;
  }

  createOrUpdateSession(socket: sio.Socket, user: any): Session {
    const session = this.getSession(socket);
    if (session) {
      session.username    = user.username;
      session.name        = user.name;
      session.isConnected = false;
      session.canPlay     = false;
      session.room        = undefined;
      return session;
    } else {
      const newSession = this.createSession(socket, user);
      this.sessions.set(socket.id, newSession);
      return newSession;
    }
  }

  createSession(socket: sio.Socket, user: any): Session {
    return {
      socket,
      username:    user.username,
      name:        user.name,
      isConnected: false,
      canPlay:     false
    };
  }

  removeSession(socket: sio.Socket): void {
    this.sessions.delete(socket.id);
  }

  getSessions(): Session[] {
    return Array
      .from(this.sessions, ([ _, value ]) => value);
  }
}
