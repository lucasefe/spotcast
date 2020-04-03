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
        const profile  = userToProfile(user);

        session.user = user;

        logger.debug(`USER CONNECTED ${user.name}`);
        socket.emit('PROFILE_UPDATED', { profile });
      }

      socket.on('disconnect', function() {
        logger.debug(`Socket id destroyed: ${socket.id}`);
        if (session.user) {
          const user = session.user;
          logger.debug(`USER DISCONNECTED ${user.name}`);
        }

        sessions.delete(socket.id);
      });
    });

    setInterval(function() {
      const userSessions = Array.from(sessions, ([ _, value ]) => value).filter(s => s.user);
      if (userSessions.length === 0)
        return;

      logger.debug(`Refreshing users and updating players: ${userSessions.length}`);
      userSessions.map(({ socket, user }) => {
        if (user) {
          updateUser(user.username).then(u => {
            if (u) {
              const player = u.currentPlayer;
              socket.emit('PLAYER_UPDATED', player);
            }
          });
        }
      });

    }, ms('2s'));
  }

  return sockets;
};

interface ProfileResponse {
  username: string;
  name: string;
}

function userToProfile(user): ProfileResponse {
  const { username } = user;
  const { name }     = user;

  return {
    username,
    name
  };
}

function getSession(socket: sio.Socket): Session {
  const sioSession = sessions.get(socket.id);
  if (sioSession)
    return sioSession;

  const newSession = { socket };
  sessions.set(socket.id, newSession);
  return newSession;
}

