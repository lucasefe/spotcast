import * as spotify              from './spotify';
import { updateUser }            from './models/user';
import http                      from 'http';
import initSessions              from './ioSession';
import logger                    from './util/logger';
import ms                        from 'ms';
import SessionStore, { Session } from './session_store';
import sio                       from 'socket.io';


const sessions = new SessionStore();

exports.initialize = function(httpServer: http.Server): sio.Server {
  logger.info('initializing socket server');
  const sockets = sio(httpServer) as sio.Server;

  initSessions(sockets);

  if (sockets) {
    sockets.on('connection', (socket: any) => {
      logger.debug(`Socket id created: ${socket.id}`);

      if (socket.request.user && socket.request.user.logged_in) {
        const { user } = socket.request;
        const session  = sessions.getSession(socket);
        session.user   = user;

        logger.debug(`User ${user.username} connected.`);
        joinRoom(user.username);
      }

      socket.on('disconnect', function() {
        logger.debug(`Socket id destroyed: ${socket.id}`);
        const session = sessions.getSession(socket);
        if (session.user) {
          const user = session.user;

          if (session.room) {
            const room = session.room;
            socket.leave(room);
            logger.debug(`User ${user.username} left ${room}.`);
            emitRoomMembersUpdated(sockets, room);
          }

          logger.debug(`User ${user.username} disconnected`);
        }

        sessions.removeSession(socket);
      });

      socket.on('JOIN', function({ room }) {
        joinRoom(room);
      });

      socket.on('CONNECT_PLAYER', function() {
        const session = sessions.getSession(socket);
        const user    = session.user;
        if (user) {
          session.isConnected = true;
          logger.debug(`User ${user.username} connected player to ${session.room}. `);
          emitProfileUpdated(socket, session);
        }
      });

      socket.on('DISCONNECT_PLAYER', function() {
        const session = sessions.getSession(socket);
        const user    = session.user;
        if (user) {
          session.isConnected = false;
          logger.debug(`User ${user.username} disconnected player from ${session.room}. `);
          emitProfileUpdated(socket, session);
        }
      });

      function joinRoom(room): void {
        const session = sessions.getSession(socket);
        const user    = session.user;
        if (!user || !room)
          return;

        const alreadyInRoom = session.room && session.room === room;
        if (alreadyInRoom) {
          logger.debug(`User ${user.username} already in room ${room}. `);
          return;
        }

        if (session.room) {
          logger.debug(`User ${user.username} left room ${session.room}`);
          socket.leave(session.room);
        }

        logger.debug(`User ${user.username} joined room ${room}`);
        session.room = room;
        socket.join(room);
        emitProfileUpdated(socket, session);
        emitRoomMembersUpdated(sockets, room);
      }
    });


    setInterval(() => {
      const userSessions = sessions.getSessions();
      if (userSessions.length === 0)
        return;

      logger.debug(`Refreshing users and updating players: ${userSessions.length}`);
      userSessions.map(session => {
        const { user } = session;

        if (user) {
          logger.debug(`Refreshing user: ${user.username}`);
          const { room } = session;

          updateUser(user.username).then(u => {
            if (u && room === user.username) {
              const playerContext = getPlayerContext(session);
              emitPlayerUpdated(sockets, room, playerContext);
            } else
              logger.debug(`Nobody listening to what user ${user.username} is playing. `);

          });
        }
      });

    }, ms('2s'));
  }

  return sockets;
};


interface UserResponse {
  username: string;
  name: string;
}


interface ProfileResponse extends UserResponse {
  room: string;
  isConnected: boolean;
}


function userToJSON(user): UserResponse {
  const { username } = user;
  const { name }     = user;

  return { username, name };
}


function sessionToJSON(session): ProfileResponse {
  const json = {
    ...userToJSON(session.user),
    room:        session.room,
    isConnected: session.isConnected
  };

  return json;
}


interface PlayerResponse {
  trackName: string;
  trackProgress: number;
  albumName: string;
  albumCoverURL: string;
  artistName: string;
  isPlaying: boolean;
}


interface PlayerContext {
  user: UserResponse;
  player: PlayerResponse|null;
}


function getPlayerContext(session: Session): PlayerContext|null {
  const { user } = session;

  if (!user)
    return null;

  return {
    user:   userToJSON(user),
    player: playerToJSON(user.currentPlayer)
  };
}


function playerToJSON(player: spotify.CurrentPlayer|undefined): PlayerResponse|null {
  if (player && player.item) {
    const trackName     = player.item.name;
    const trackProgress = player.progressMS * 100 / player.item.duration_ms;

    const albumName     = player.item.album.name;
    const artistName    = player.item.artists.map(a => a.name).join(', ');
    const albumCoverURL = player.item.album.images[0].url;
    const isPlaying     = player.isPlaying;

    return { trackProgress, trackName, artistName, albumName, albumCoverURL, isPlaying };
  } else
    return null;
}



function getMembers(clients): Array<UserResponse> {
  return clients.map(client => {
    const userSession = sessions.getSessionById(client);
    if (userSession && userSession.user)
      return userToJSON(userSession.user);
    else
      return null;
  }).filter(Boolean);
}


function emitRoomMembersUpdated(sockets, room): void {
  sockets.in(room).clients(function(error, clients) {
    if (error)
      throw error;

    const members = getMembers(clients);
    sockets.in(room).emit('MEMBERS_UPDATED', { members });
  });
}


function emitProfileUpdated(socket, session): void {
  socket.emit('PROFILE_UPDATED', { profile: sessionToJSON(session) });
}


function emitPlayerUpdated(sockets, room, playerContext): void {
  sockets.in(room).emit('PLAYER_UPDATED', playerContext);
}
