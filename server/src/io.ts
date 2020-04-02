import { default as connectMongoDBSession } from 'connect-mongodb-session';
import cookieParser                         from 'cookie-parser';
import http                                 from 'http';
import logger                               from './util/logger';
import passport                             from 'passport';
import passportSocketIo                     from 'passport.socketio';
import session                              from 'express-session';
import sio                                  from 'socket.io';

const MongoStore = connectMongoDBSession(session);
const store      = new MongoStore({
  uri:        'mongodb://localhost:27017/fogon',
  collection: 'sessions'
});

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
      logger.debug(`A user connected with ${socket.id}`);
      socket.emit('PLAYLIST_UPDATED', { currentSong: 'connected' });

      if (socket.request.user && socket.request.user.logged_in)
        logger.debug(socket.request.user);
    });
  }

  logger.debug('ssssssssssssssss');

  return sockets;
};
