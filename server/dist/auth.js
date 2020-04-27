"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const passport_spotify_1 = __importDefault(require("passport-spotify"));
const user_1 = __importDefault(require("./models/user"));
exports.clientID = '83ccfd2305cc4bc4956138041b97e3a9';
exports.clientSecret = '76c34e6e20f4410685724966258e03ee';
const callbackURL = process.env.NODE_ENV === 'production' ?
    'http://fogon.herokuapp.com/login/callback' :
    'http://localhost:3000/login/callback';
const debug = debug_1.default('auth');
const SpotifyStrategy = passport_spotify_1.default.Strategy;
const spotifyStrategy = new SpotifyStrategy({ clientID: exports.clientID, clientSecret: exports.clientSecret, callbackURL }, function onSuccessAuth(accessToken, refreshToken, expiresIn, profile, done) {
    const photoURL = profile.photos && profile.photos[0];
    const name = profile.displayName;
    findOrInitializeUser(profile.id)
        .then(user => {
        const verb = user.isNew ? 'created' : 'updated';
        debug(`User ${verb} Spotify profile: ${JSON.stringify(profile)}`);
        user.set({ name, photoURL, accessToken, refreshToken, expiresIn });
        return user.save();
    }).then(() => {
        done(null, { id: profile.id });
    });
});
const spotifyScopes = [
    'user-read-email',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-currently-playing'
];
passport_1.default.use(spotifyStrategy);
passport_1.default.serializeUser((user, done) => {
    debug(`Serialized user: ${user.id}`);
    done(null, user.id);
});
passport_1.default.deserializeUser((id, done) => {
    if (typeof id === 'string') {
        user_1.default.findOne({ username: id }, function (err, user) {
            if (user) {
                debug(`Deserialized user: ${user.username}`);
                done(null, user);
            }
            else
                done(err);
        });
    }
    else
        done(new Error(`Expected id to be a string when serializing: ${id}`));
});
exports.routes = express_1.default();
exports.routes.get('/login', passport_1.default.authenticate('spotify', { scope: spotifyScopes, showDialog: true }), function () { });
exports.routes.get('/login/callback', passport_1.default.authenticate('spotify', { failureRedirect: '/' }), function (req, res) {
    res.redirect('/');
});
function findOrInitializeUser(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield user_1.default.findOne({ username });
        if (user)
            return user;
        else
            return new user_1.default({ username });
    });
}
function secured(req, res, next) {
    if (req.user)
        next();
    else {
        req.session.returnTo = req.originalUrl; /* eslint-disable-line no-param-reassign */
        res.redirect('/login');
    }
}
exports.secured = secured;
//# sourceMappingURL=auth.js.map