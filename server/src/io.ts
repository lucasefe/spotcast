import * as spotify                                          from './spotify';
import { default as connectMongoDBSession }                  from 'connect-mongodb-session';
import { updateUser }                                        from './models/user';
import { UserModel }                                         from './models/user';
import cookieParser                                          from 'cookie-parser';
import expressSession                                        from 'express-session';
import http                                                  from 'http';
import logger                                                from './util/logger';
import ms                                                    from 'ms';
import passport                                              from 'passport';
import passportSocketIo                                      from 'passport.socketio';
import sio                                                   from 'socket.io';

const MongoStore = connectMongoDBSession(expressSession);
const store      = new MongoStore({
  uri:        'mongodb://localhost:27017/fogon',
  collection: 'sessions'
});

interface Session {
  socket: sio.Socket;
  user?: UserModel;
  room?: string;
}

const sessions = new Map<string, Session>();

exports.initialize = function(httpServer: http.Server): sio.Server {
  logger.info('initializing socket server');
  const sockets = sio(httpServer) as sio.Server;

  sockets.use(passportSocketIo.authorize({
    key:               'fogon.session',
    name:              'fogon.session',
    secret:            'cats', // TODO: replace secret
    proxy:             true,
    resave:            false,
    saveUninitialized: false,
    store,
    passport,
    cookieParser,
    success:           onAuthorizeSuccess,  // *optional* callback on success - read more below
    fail:              onAuthorizeFail
  }));

  function onAuthorizeSuccess(data, accept): void {
    logger.debug('successful connection to socket.io');

    // If you use socket.io@1.X the callback looks different
    accept();
  }

  function onAuthorizeFail(data, message, error, accept): void {
    if (error)
      throw new Error(message);

    logger.warn('failed connection to socket.io:', message);

    // We use this callback to log all of our failed connections.
    accept(null, false);

    // OR

    // If you use socket.io@1.X the callback looks different
    // If you don't want to accept the connection
    if (error)
      accept(new Error(message));
    // this error will be sent to the user as a special error-package
    // see: http://socket.io/docs/client-api/#socket > error-object
  }

  if (sockets) {
    sockets.on('connection', (socket: any) => {
      logger.debug(`Socket id created: ${socket.id}`);
      const session = getSession(socket);

      if (socket.request.user && socket.request.user.logged_in) {
        const { user } = socket.request;
        session.user   = user;

        logger.debug(`User ${user.username} connected.`);
        joinRoom(user.username);
      }

      socket.on('disconnect', function() {
        logger.debug(`Socket id destroyed: ${socket.id}`);
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

        sessions.delete(socket.id);
      });

      socket.on('JOIN', function({ room }) {
        joinRoom(room);
      });

      function joinRoom(room): void {
        const user = session.user;
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


    setInterval(function() {
      const userSessions = Array.from(sessions, ([ _, value ]) => value).filter(s => s.user);
      if (userSessions.length === 0)
        return;

      logger.debug(`Refreshing users and updating players: ${userSessions.length}`);
      userSessions.map(({ user, room }) => {
        if (user) {
          updateUser(user.username).then(u => {
            if (u && room === user.username) {
              const playerContext = getPlayerContext(u);
              sockets.in(room).emit('PLAYER_UPDATED', playerContext);
            }
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
}

function userToJSON(user): UserResponse {
  const { username } = user;
  const { name }     = user;

  return { username, name };
}

function sessionToJSON(session): ProfileResponse {
  return {
    ...userToJSON(session.user),
    room: session.room
  };
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

function getPlayerContext(user: UserModel): PlayerContext {
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

function getSession(socket: sio.Socket): Session {
  const sioSession = sessions.get(socket.id);
  if (sioSession)
    return sioSession;

  const newSession = { socket };
  sessions.set(socket.id, newSession);
  return newSession;
}

function getMembers(clients): Array<UserResponse> {
  return clients.map(client => {
    const userSession = sessions.get(client);
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
