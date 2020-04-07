import { UserModel }    from './models/user';
import sio              from 'socket.io';

export interface Session {
  socket: sio.Socket;
  user?: UserModel;
  room?: string;
  isConnected: boolean;
}


export default class SessionStore {
  private sessions: Map<string, Session>
  constructor() {
    this.sessions = new Map<string, Session>();
  }

  getSessionById(id: string): Session| undefined {
    const sioSession = this.sessions.get(id);
    return sioSession;
  }

  getSession(socket: sio.Socket): Session {
    const sioSession = this.sessions.get(socket.id);
    if (sioSession)
      return sioSession;

    const newSession = {
      socket,
      isConnected: false
    };

    this.sessions.set(socket.id, newSession);
    return newSession;
  }

  removeSession(socket: sio.Socket): void {
    this.sessions.delete(socket.id);
  }

  getSessions(): Session[] {
    return Array
      .from(this.sessions, ([ _, value ]) => value)
      .filter(s => s.user);
  }
}
