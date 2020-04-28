import * as auth                            from './auth';
import * as http                            from 'http';
import { default as connectMongoDBSession } from 'connect-mongodb-session';
import bodyParser                           from 'body-parser';
import cookieParser                         from 'cookie-parser';
import cors                                 from 'cors';
import EJS                                  from 'ejs';
import express                              from 'express';
import mongoose                             from 'mongoose';
import morgan                               from 'morgan';
import passport                             from 'passport';
import rollbar                              from '../lib/rollbar';
import session                              from 'express-session';


/* eslint-disable camelcase */

require('../lib/router_with_promises');

export default function configureServer(): http.Server {
  const mongoURI = process.env.MONGODB_URI ?
    process.env.MONGODB_URI  :
    'mongodb://localhost:27017/fogon';

  mongoose.connect(mongoURI, {
    useNewUrlParser: true
  });

  const app        = express();
  const MongoStore = connectMongoDBSession(session);
  const store      = new MongoStore({
    uri:        mongoURI,
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
    console.log(`username is ${req.params.username}`);
    res.render('index.html');
  });

  const httpServer = http.createServer(app);

  require('./io').initialize(httpServer);

  return httpServer;
}


