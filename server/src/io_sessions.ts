import { default as connectMongoDBSession }                  from 'connect-mongodb-session';
import { getMongoURI }                                       from '../config';
import cookieParser                                          from 'cookie-parser';
import expressSession                                        from 'express-session';
import logger                                                from './util/logger';
import passport                                              from 'passport';
import passportSocketIo                                      from 'passport.socketio';

export default function(sockets): void {
  const MongoStore = connectMongoDBSession(expressSession);

  const store = new MongoStore({
    uri:        getMongoURI(),
    collection: 'sessions'
  });

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
}


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
