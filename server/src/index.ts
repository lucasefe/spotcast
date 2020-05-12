import * as auth                             from './auth';
import * as http                             from 'http';
import { configure, getMongoURI }            from  './config';
import { default as connectMongoDBSession }  from 'connect-mongodb-session';
import bodyParser                            from 'body-parser';
import cookieParser                          from 'cookie-parser';
import cors                                  from 'cors';
import EJS                                   from 'ejs';
import express                               from 'express';
import morgan                                from 'morgan';
import passport                              from 'passport';
import rollbar                               from '../lib/rollbar';
import session                               from 'express-session';
import SessionStore                          from './session_store';
import startWorker                           from './worker';

/* eslint-disable camelcase */

require('../lib/router_with_promises');

export default function configureServer(): http.Server {

  configure();

  const sessions = new SessionStore();

  const app        = express();
  const MongoStore = connectMongoDBSession(session);
  const store      = new MongoStore({
    uri:        getMongoURI(),
    collection: 'sessions'
  });

  app.use(rollbar.errorHandler());
  app.use(express.static(`${__dirname  }/../public`));
  app.use(cors());
  app.use(cookieParser());

  app.use(session({
    key:               'fogon.session',
    name:              'fogon.session',
    secret:            'cats', // TODO: replace secret
    proxy:             true,
    resave:            false,
    saveUninitialized: false,
    store
  }));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.set('views', './public');
  app.use(morgan('combined'));
  app.engine('html', EJS.renderFile);
  app.set('view engine', 'html');

  app.use(auth.routes);

  app.get('/:username', auth.secured, function(req, res) {
    res.render('index.html');
  });

  const httpServer = http.createServer(app);

  const sockets    = require('./io').initialize(httpServer, sessions); /* eslint-disable-line global-require */
  const stopWorker = startWorker(sockets,  sessions);

  httpServer.on('close', stopWorker);

  return httpServer;
}


