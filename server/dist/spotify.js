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
function getAccessToken({ refreshToken }) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield requestAccessToken({ refreshToken });
        return {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in
        };
    });
}
exports.getAccessToken = getAccessToken;
function getCurrentPlayer({ accessToken }) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${accessToken}`
            }
        };
        const response = yield axios_1.default.get('https://api.spotify.com/v1/me/player', options);
        return {
            device: response.data.device,
            shuffleState: response.data.shuffle_state,
            repeatState: response.data.repeat_state,
            timestamp: response.data.timestamp,
            context: response.data.context,
            progressMS: response.data.progress_ms,
            item: response.data.item,
            currentlyPlayingType: response.data.currently_playing_type,
            isPlaying: response.data.is_playing
        };
    });
}
exports.getCurrentPlayer = getCurrentPlayer;
function play(user, itemURI, progressMS) {
    return __awaiter(this, void 0, void 0, function* () {
        debug(`Playing  ${user.username}:${itemURI}:${progressMS}`);
        const instance = getSpotifyAPIClient(user);
        yield instance.put('/me/player/play', {
            uris: [itemURI],
            position_ms: progressMS
        });
    });
}
exports.play = play;
function pause(user) {
    return __awaiter(this, void 0, void 0, function* () {
        debug(`Pausing  ${user.username}`);
        const instance = getSpotifyAPIClient(user);
        yield instance.put('/me/player/pause');
    });
}
exports.pause = pause;
function requestAccessToken({ refreshToken }) {
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
    return axios_1.default.post('https://accounts.spotify.com/api/token', data, options);
}
function getSpotifyAPIClient(user) {
    const { accessToken, refreshToken } = user;
    const instance = axios_1.default.create({
        baseURL: 'https://api.spotify.com/v1',
        timeout: 1000,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });
    instance.interceptors.response.use(response => {
        return response;
    }, function (error) {
        debug(error.response.data.error);
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            return requestAccessToken({ refreshToken })
                .then(res => {
                const newAccessToken = res.data.access_token;
                // TODO Store token
                // const expiresIn      = res.data.expires_in;
                if (res.status === 200) {
                    originalRequest.headers.common.Authorization = `Bearer ${newAccessToken}`;
                    return axios_1.default(originalRequest);
                }
                else
                    return res;
            });
        }
        else if (error.response.status === 404)
            return Promise.reject('NoDevice');
        else
            return Promise.reject(error);
    });
    return instance;
}
//# sourceMappingURL=spotify.js.map