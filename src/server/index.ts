import * as http                          from 'http';
import { AddTrackToPlaylistAction }       from './actions';
import { ClearPlaylist }                  from './actions';
import { PlaylistRequestedEvent }         from './events';
import { PlaylistUpdatedEvent }           from './events';
import { RemoveTrackFromPlaylistAction }  from './actions';
import { UserConnectedEvent }             from './events';
import { UserDisconnectedEvent }          from './events';
import express                            from 'express';
import Playlist                           from './models/playlist';
import SocketIO                           from 'socket.io';
import Track                              from './models/track';
import User                               from './models/user';


export default function configureServer(): http.Server {
  const app = express();
  const httpServer = http.createServer(app);
  const sockets = SocketIO(httpServer) as SocketIO.Server;
  const users = new Map<string, User>();
  const playlist = new Playlist();

  function connectUser(socket: SocketIO.Socket): User {
    const user = new User(socket);
    users.set(socket.id, user);
    return user;
  }

  function disconnectUser(socket: SocketIO.Socket): void {
    users.delete(socket.id);
  }

  sockets.on('connection', socket => {
    const user = connectUser(socket);
    socket.on('disconnect', () => {
      disconnectUser(socket);
      sockets.emit(UserDisconnectedEvent.eventName, new UserDisconnectedEvent(user));
    });

    socket.on(PlaylistRequestedEvent.eventName, () => {
      socket.emit(PlaylistRequestedEvent.eventName, new PlaylistRequestedEvent(playlist));
    });

    socket.on(AddTrackToPlaylistAction.actionName, ({ trackID }, ackFn) => {
      const track = new Track(trackID, user.userID);
      playlist.add(track);
      if (ackFn)
        ackFn(true);

      socket.emit(PlaylistUpdatedEvent.eventName, new PlaylistUpdatedEvent(playlist));
    });

    socket.on(RemoveTrackFromPlaylistAction.actionName, ({ trackID }, ackFn) => {
      const track = new Track(trackID, user.userID);
      playlist.remove(track);

      if (ackFn)
        ackFn(true);

      socket.emit(PlaylistUpdatedEvent.eventName, new PlaylistUpdatedEvent(playlist));
    });

    socket.on(ClearPlaylist.actionName, ackFn => {
      playlist.clear();

      if (ackFn)
        ackFn(true);

      socket.emit(PlaylistUpdatedEvent.eventName, new PlaylistUpdatedEvent(playlist));
    });

    const event = new UserConnectedEvent(user);
    sockets.emit(UserConnectedEvent.eventName, event);
  });

  return httpServer;

}
