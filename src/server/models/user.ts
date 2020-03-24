import * as SocketIO from 'socket.io';
import * as uuid     from 'uuid';

export class User {
  public userId: string;
  public socket: SocketIO.Socket;

  constructor(socket: SocketIO.Socket) {
    this.socket = socket;
    this.userId = uuid.v4();
  }
}
