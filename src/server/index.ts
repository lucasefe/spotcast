import * as http                                  from 'http';
import { default as connectMongoDBSession }       from 'connect-mongodb-session';
import bodyParser                                 from 'body-parser';
import cookieParser                               from 'cookie-parser';
import cors                                       from 'cors';
import EJS                                        from 'ejs';
import express                                    from 'express';
import mongoose                                   from 'mongoose';
import passport                                   from 'passport';
import PassportSpotify                            from 'passport-spotify';
import session                                    from 'express-session';
import User                                       from './user';

const clientID = '83ccfd2305cc4bc4956138041b97e3a9';
const clientSecret = '76c34e6e20f4410685724966258e03ee';
const callbackURL =  'http://localhost:3000/login/callback';

/* eslint-disable max-params */
/* eslint-disable camelcase */

function onSuccessAuth(accessToken, refreshToken, expiresIn, profile, done): void{
  const id = profile.id;
  const photoURL = profile.photos && profile.photos[0];

  const user = new User({
    username:  profile.id,
    name:      profile.displayName,
    photoURL,
    accessToken,
    refreshToken,
    expiresIn
  });

  user.save(() => {
    done(null, { id });
  });
}
const SpotifyStrategy = PassportSpotify.Strategy;
const spotifyStrategy = new SpotifyStrategy({ clientID, clientSecret, callbackURL }, onSuccessAuth);
passport.use(spotifyStrategy);

passport.serializeUser<any, any>((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  if (typeof id === 'string') {
    User.findOne({ username: id }, function(err, user) {
      if (user) done(null, user);
      else done(err);
    });
  } else
    done(new Error(`Expected id to be a string when serializing: ${id}`));
});


function secured(req, res, next): void{
  if (req.user)
    next();
  else {
    req.session.returnTo = req.originalUrl;/* eslint-disable-line no-param-reassign */
    res.redirect('/login');
  }
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

  app.get(
    '/login',
    passport.authenticate('spotify', {
      scope: [
        'user-read-email',
        'user-modify-playback-state',
        'user-read-playback-state',
        'user-read-currently-playing'
      ],
      showDialog: true
    }),
    function() {}
  );

  app.get('/login/callback', passport.authenticate('spotify', { failureRedirect: '/' }), function(req, res) {
    res.redirect('/app');
  });

  app.get('/app', secured, function(req, res) {
    res.render('app', { user: req.user });
  });

  const httpServer = http.createServer(app);
  return httpServer;
}

