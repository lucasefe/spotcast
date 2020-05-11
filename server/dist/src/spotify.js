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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth = __importStar(require("./auth"));
const axios_1 = __importDefault(require("axios"));
const debug_1 = __importDefault(require("debug"));
const qs_1 = __importDefault(require("qs"));
Promise.resolve().then(() => __importStar(require('axios-debug-log')));
const debug = debug_1.default('spotify');
class PlayerNotRespondingError extends Error {
}
exports.PlayerNotRespondingError = PlayerNotRespondingError;
function getAccessToken(user) {
    return __awaiter(this, void 0, void 0, function* () {
        debug(`Getting access token for user ${user.username}`);
        const { refreshToken } = user;
        const options = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            auth: {
                username: auth.clientID,
                password: auth.clientSecret
            }
        };
        const data = qs_1.default.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });
        const response = yield axios_1.default.post('https://accounts.spotify.com/api/token', data, options);
        return {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in
        };
    });
}
exports.getAccessToken = getAccessToken;
function getPlayingState(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const { accessToken } = user;
        const options = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${accessToken}`
            }
        };
        const instance = getSpotifyAPIClient(user);
        const response = yield instance.get('/me/player', options);
        return response;
    });
}
exports.getPlayingState = getPlayingState;
function play(user, itemURI, progressMS) {
    return __awaiter(this, void 0, void 0, function* () {
        debug(`Playing  ${user.username}:${itemURI}:${progressMS}`);
        const instance = getSpotifyAPIClient(user);
        try {
            yield instance.put('/me/player/play', {
                uris: [itemURI],
                position_ms: progressMS
            });
        }
        catch (error) {
            if (error.response && error.response.status === 404)
                throw new PlayerNotRespondingError();
            else
                throw error;
        }
    });
}
exports.play = play;
function pause(user) {
    return __awaiter(this, void 0, void 0, function* () {
        debug(`Pausing  ${user.username}`);
        const instance = getSpotifyAPIClient(user);
        try {
            yield instance.put('/me/player/pause');
        }
        catch (error) {
            if (error.response && error.response.status === 404)
                throw new PlayerNotRespondingError();
            else
                throw error;
        }
    });
}
exports.pause = pause;
function getSpotifyAPIClient(user) {
    const { accessToken } = user;
    const instance = axios_1.default.create({
        baseURL: 'https://api.spotify.com/v1',
        timeout: 5000,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });
    instance.interceptors.response.use(response => {
        return response;
    }, function (error) {
        if (error.response.error)
            debug(error.response.error);
        else
            debug(error);
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            return refreshAccessToken(user)
                .then(newAccessToken => {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axios_1.default(originalRequest);
            });
        }
        else
            return Promise.reject(error);
    });
    return instance;
}
function refreshAccessToken(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const { accessToken: newAccessToken, expiresIn } = yield getAccessToken(user);
        debug(`Saving access token for user ${user.username}`);
        user.set({ accessToken: newAccessToken, expiresIn });
        yield user.save();
        return newAccessToken;
    });
}
//# sourceMappingURL=spotify.js.map