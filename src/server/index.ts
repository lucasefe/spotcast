import * as http                                  from 'http';
import { default as connectMongoDBSession }       from 'connect-mongodb-session';
import { secured }                                from './auth';
import auth                                       from './auth';
import bodyParser                                 from 'body-parser';
import cookieParser                               from 'cookie-parser';
import cors                                       from 'cors';
import EJS                                        from 'ejs';
import express                                    from 'express';
import mongoose                                   from 'mongoose';
import passport                                   from 'passport';
import session                                    from 'express-session';

/* eslint-disable max-params */
/* eslint-disable camelcase */

export default function configureServer(): http.Server {
  mongoose.connect('mongodb://localhost:27017/fogon', {
    useNewUrlParser: true
  });

  const app = express();
  const MongoStore = connectMongoDBSession(session);
  const store = new MongoStore({
    uri:        'mongodb://localhost:27017/fogon',
    collection: 'sessions'
  });
  app.use(express.static(`${__dirname  }/../../public`));
  app.use(cors());
  app.use(cookieParser());

  app.use(session({
    name:              'fogon.session',
    secret:            'cats',
    proxy:             true,
    resave:            false,
    saveUninitialized: false,
    store
  }));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.set('views', './views');
  app.engine('ejs', EJS.renderFile);
  app.set('view engine', 'ejs');

  app.use(auth);

  app.get('/app', secured, function(req, res) {
    res.render('app', { user: req.user });
  });

  const httpServer = http.createServer(app);
  return httpServer;
}

