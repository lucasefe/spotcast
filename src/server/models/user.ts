import * as SocketIO from 'socket.io';
import * as uuid     from 'uuid';

export default class User {
  public userID: string;
  public socket: SocketIO.Socket;

  constructor(socket: SocketIO.Socket) {
    this.socket = socket;
    this.userID = uuid.v4();
  }
}
