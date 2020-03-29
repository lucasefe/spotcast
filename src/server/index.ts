import * as auth                                         from './auth';
import * as http                                         from 'http';
import * as spotify                                      from './spotify';
import { default as connectMongoDBSession }              from 'connect-mongodb-session';
import { secured }                                       from './auth';
import { UserModel }                                     from './models/user';
import bodyParser                                        from 'body-parser';
import cookieParser                                      from 'cookie-parser';
import cors                                              from 'cors';
import EJS                                               from 'ejs';
import express                                           from 'express';
import mongoose                                          from 'mongoose';
import passport                                          from 'passport';
import session                                           from 'express-session';
import User                                              from './models/user';

/* eslint-disable max-params */
/* eslint-disable camelcase */

require('../../lib/router_with_promises');

async function updateUser(username): Promise<UserModel | null> {
  const user = await User.findOne({ username });
  if (user) {
    const { accessToken, expiresIn } = await spotify.getAccessToken(user);
    user.set({ accessToken, expiresIn, accessTokenRefreshedAt: Date.now() });
    await user.save();
    return user;
  } else
    return null;
}


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
    secret:            'cats', // TODO: replace secret
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

  app.use(auth.routes);

  app.get('/app', secured, async function(req, res) {
    const user: any = req.user;
    const updatedUser = await updateUser(user.username);
    res.render('app', { user: updatedUser });
  });

  const httpServer = http.createServer(app);
  return httpServer;
}
