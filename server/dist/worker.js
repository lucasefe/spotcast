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
const spotify = __importStar(require("./spotify"));
const io_1 = require("./io");
const io_2 = require("./io");
const io_3 = require("./io");
const io_4 = require("./io");
const user_1 = require("./models/user");
const io_5 = require("./io");
const bluebird_1 = __importDefault(require("bluebird"));
const debug_1 = __importDefault(require("debug"));
const logger_1 = __importDefault(require("./util/logger"));
const ms_1 = __importDefault(require("ms"));
const rollbar_1 = __importDefault(require("../lib/rollbar"));
const debug = debug_1.default('sync');
let isRunning = false;
function startWorker(sockets, sessions) {
    isRunning = true;
    scheduleNextPlayersUpdate(sockets, sessions);
    return stopWorker;
}
exports.default = startWorker;
function stopWorker() {
    isRunning = false;
}
function scheduleNextPlayersUpdate(sockets, sessions) {
    setTimeout(() => {
        if (!isRunning) {
            debug('stopping worker');
            return;
        }
        updatePlayers(sockets, sessions)
            .finally(function () {
            scheduleNextPlayersUpdate(sockets, sessions);
        })
            .catch(error => {
            handlerError(sockets, error);
        });
    }, ms_1.default('2s'));
}
function handlerError(sockets, error) {
    debug({ error });
    logger_1.default.error(error);
    rollbar_1.default.error(error);
}
function updatePlayers(sockets, sessions) {
    return __awaiter(this, void 0, void 0, function* () {
        const allSessions = sessions
            .getSessions();
        debug(`Sessions: ${allSessions.length}`);
        yield bluebird_1.default.map(allSessions, refreshSession, { concurrency: 10 });
        const sessionsPlaying = sessions
            .getSessions()
            .filter(session => session.username === session.room);
        debug(`Sessions playing: ${sessionsPlaying.length}`);
        yield bluebird_1.default.map(sessionsPlaying, function (session) {
            return __awaiter(this, void 0, void 0, function* () {
                yield updatePlayersAndListeners(sockets, sessions, session);
            });
        }, { concurrency: 10 });
    });
}
function refreshSession(session) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, product } = session;
        const user = yield user_1.updateUser(username);
        const canPlay = !!(user && user.currentlyPlaying && user.currentlyPlaying.device);
        debug({ username, canPlay, product });
        const statusChanged = session.canPlay !== canPlay;
        session.canPlay = canPlay;
        session.previouslyPlaying = session.isListening ? session.currentlyPlaying : null;
        session.currentlyPlaying = user.currentlyPlaying;
        session.isListening = canPlay && session.isListening;
        if (statusChanged)
            io_4.emitSessionUpdated(session);
    });
}
function updatePlayersAndListeners(sockets, sessions, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username } = session;
        const { room } = session;
        const player = getPlayerState(session);
        io_2.emitPlayerUpdated(sockets, room, player);
        const sessionsListening = io_5.getListeningSessions(sessions, room);
        debug(`Sessions listening to ${username}: ${sessionsListening.length}`);
        yield synchronizeListeners(sockets, sessionsListening, session);
    });
}
function synchronizeListeners(sockets, sessionsListening, sessionPlaying) {
    return __awaiter(this, void 0, void 0, function* () {
        const { currentlyPlaying } = sessionPlaying;
        yield bluebird_1.default.map(sessionsListening, function (session) {
            return __awaiter(this, void 0, void 0, function* () {
                const { username } = session;
                const user = yield user_1.findUser(username);
                debug({ username, pre: session.previouslyPlaying, now: session.currentlyPlaying });
                if (session.isListening && session.canPlay) {
                    const wasListening = session.previouslyPlaying && session.previouslyPlaying.isPlaying;
                    const changedSong = wasListening && session.previouslyPlaying.item.uri !== session.currentlyPlaying.item.uri;
                    const pausedPlayer = session.previouslyPlaying && session.previouslyPlaying.isPlaying && !session.currentlyPlaying.isPlaying;
                    const shouldDisconnect = changedSong || pausedPlayer;
                    debug({ username, wasListening, changedSong, pausedPlayer, shouldDisconnect });
                    if (shouldDisconnect) {
                        const reason = getDisconnectReason({ changedSong, pausedPlayer });
                        io_3.emitSessionError(session, { name: 'UserDisconnected', message: 'User disconnected', reason });
                        io_1.disconnectPlayer(session);
                        return;
                    }
                    try {
                        const isPlayingSameSong = session.currentlyPlaying.item.uri === currentlyPlaying.item.uri;
                        const isTooApart = Math.abs(session.currentlyPlaying.progressMS - currentlyPlaying.progressMS) > ms_1.default('4s');
                        const shouldPlay = currentlyPlaying.isPlaying && (!isPlayingSameSong || isTooApart);
                        const shouldPause = !currentlyPlaying.isPlaying && session.currentlyPlaying.isPlaying;
                        debug({ username, isPlayingSameSong, isTooApart, shouldPlay, shouldPause });
                        if (shouldPlay)
                            yield spotify.play(user, currentlyPlaying.item.uri, currentlyPlaying.progressMS);
                        else if (shouldPause)
                            yield spotify.pause(user);
                    }
                    catch (error) {
                        if (error instanceof spotify.PlayerNotRespondingError) {
                            user.set({ 'currentlyPlaying.lastErrorStatus': 404 });
                            yield user.save();
                            io_3.emitSessionError(session, { name: 'PlayerNotResponding', message: 'Your player is not responding. ' });
                            io_1.disconnectPlayer(session);
                        }
                    }
                }
            });
        });
    });
}
function getDisconnectReason({ changedSong, pausedPlayer }) {
    if (changedSong)
        return 'You switched songs';
    else if (pausedPlayer)
        return 'You paused your player';
    else
        return 'unknown reason :-(';
}
function getPlayerState(session) {
    return {
        session: {
            name: session.name,
            username: session.username
        },
        player: getPlayer(session.currentlyPlaying)
    };
}
function getPlayer(player) {
    if (player && player.item) {
        const trackName = player.item.name;
        const trackProgress = player.progressMS * 100 / player.item.duration_ms;
        const albumName = player.item.album.name;
        const artistName = player.item.artists.map(a => a.name).join(', ');
        const albumCoverURL = player.item.album.images[0].url;
        return {
            trackProgress,
            trackName,
            artistName,
            albumName,
            albumCoverURL,
            isPlaying: player.isPlaying
        };
    }
    else
        return player;
}
//# sourceMappingURL=worker.js.map