import * as http                         from 'http';
import { AddTrackToPlaylistAction }      from './actions';
import { PlaylistRequestedEvent }        from './events';
import { PlaylistUpdatedEvent }          from './events';
import { RemoveTrackFromPlaylistAction } from './actions';
import { UserConnectedEvent }            from './events';
import { UserDisconnectedEvent }         from './events';
import Playlist                          from './models/playlist';
import SocketIO                          from 'socket.io';
import Track                             from './models/track';
import User                              from './models/user';


class Server {
  private sockets: SocketIO.Server;
  private users: Map<string, User>;
  private playlist: Playlist;

  constructor(httpServer: http.Server) {
    this.sockets = SocketIO(httpServer) as SocketIO.Server;
    this.users = new Map<string, User>();
    this.playlist = new Playlist();

    this.sockets.on('connection', socket => {
      const user = this.connectUser(socket);
      socket.on('disconnect', () => {
        this.disconnectUser(socket);
        this.sockets.emit(UserDisconnectedEvent.eventName, new UserDisconnectedEvent(user));
      });

      socket.on(PlaylistRequestedEvent.eventName, () => {
        socket.emit(PlaylistRequestedEvent.eventName, new PlaylistRequestedEvent(this.playlist));
      });

      socket.on(AddTrackToPlaylistAction.actionName, ({ trackID }, ackFn) => {
        const track = new Track(trackID, user.userID);
        this.playlist.add(track);
        if (ackFn)
          ackFn(true);

        socket.emit(PlaylistUpdatedEvent.eventName, new PlaylistUpdatedEvent(this.playlist));
      });

      socket.on(RemoveTrackFromPlaylistAction.actionName, ({ trackID }, ackFn) => {
        const track = new Track(trackID, user.userID);
        this.playlist.remove(track);

        if (ackFn)
          ackFn(true);

        socket.emit(PlaylistUpdatedEvent.eventName, new PlaylistUpdatedEvent(this.playlist));
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
