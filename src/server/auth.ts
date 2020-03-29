import Debug            from 'debug';
import express          from 'express';
import passport         from 'passport';
import PassportSpotify  from 'passport-spotify';
import User             from './models/user';

export const clientID = '83ccfd2305cc4bc4956138041b97e3a9';
export const  clientSecret = '76c34e6e20f4410685724966258e03ee';

const callbackURL =  'http://localhost:3000/login/callback';
const debug = Debug('auth');

/* eslint-disable max-params */

const SpotifyStrategy = PassportSpotify.Strategy;
const spotifyStrategy = new SpotifyStrategy({ clientID, clientSecret, callbackURL },
  function onSuccessAuth(accessToken, refreshToken, expiresIn, profile, done): void{
    const id = profile.id;
    const photoURL = profile.photos && profile.photos[0];
    const username = profile.id;
    const name =      profile.displayName;
    const user = new User({ username, name, photoURL, accessToken, refreshToken, expiresIn });

    user.save(() => {
      debug(`User created from Spotify profile: ${JSON.stringify(profile)}`);
      done(null, { id });
    });
  }
);

const spotifyScopes   = [
  'user-read-email',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing'
];

passport.use(spotifyStrategy);


passport.serializeUser<any, any>((user, done) => {
  debug(`Serialized user: ${user.id}`);
  done(null, user.id);
});


passport.deserializeUser((id, done) => {
  if (typeof id === 'string') {
    User.findOne({ username: id }, function(err, user) {
      if (user) {
        debug(`Deserialized user: ${user.username}`);
        done(null, user);
      } else
        done(err);
    });
  } else
    done(new Error(`Expected id to be a string when serializing: ${id}`));
});

export const routes = express();

routes.get('/login', passport.authenticate('spotify', { scope: spotifyScopes, showDialog: true }), function() {});

routes.get('/login/callback', passport.authenticate('spotify', { failureRedirect: '/' }), function(req, res) {
  res.redirect('/app');
});


export function secured(req, res, next): void {
  if (req.user)
    next();
  else {
    req.session.returnTo = req.originalUrl;/* eslint-disable-line no-param-reassign */
    res.redirect('/login');
  }
}

