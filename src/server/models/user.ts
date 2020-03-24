import * as uuid from 'uuid';
import * as SocketIO from 'socket.io';

export class User {
  public userId: string;
  public socket: SocketIO.Socket;

  constructor(socket: SocketIO.Socket) {
    this.socket = socket;
    this.userId = uuid.v4();
  }
}
