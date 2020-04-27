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
const user_1 = require("./models/user");
const bluebird_1 = __importDefault(require("bluebird"));
const debug_1 = __importDefault(require("debug"));
const ioSession_1 = __importDefault(require("./ioSession"));
const logger_1 = __importDefault(require("./util/logger"));
const ms_1 = __importDefault(require("ms"));
const session_store_1 = __importDefault(require("./session_store"));
const socket_io_1 = __importDefault(require("socket.io"));
const debug = debug_1.default('sync');
const sessions = new session_store_1.default();
exports.initialize = function (httpServer) {
    logger_1.default.info('initializing socket server');
    const sockets = socket_io_1.default(httpServer);
    ioSession_1.default(sockets);
    if (sockets) {
        sockets.on('connection', (socket) => {
            logger_1.default.debug(`Socket id created: ${socket.id}`);
            if (socket.request.user && socket.request.user.logged_in) {
                const { user } = socket.request;
                const session = sessions.createOrUpdateSession(socket, user);
                logger_1.default.debug(`User ${user.username} connected.`);
                joinRoom(session, session.username);
            }
            socket.on('disconnect', function () {
                logger_1.default.debug(`Socket id destroyed: ${socket.id}`);
                const session = sessions.getSession(socket);
                if (session) {
                    const { username } = session;
                    logger_1.default.debug(`User ${username} disconnected`);
                    sessions.removeSession(socket);
                    if (session.room)
                        leaveRoom(session);
                }
            });
            socket.on('JOIN', function ({ room }) {
                const session = sessions.getSession(socket);
                if (session)
                    joinRoom(session, room);
            });
            socket.on('CONNECT_PLAYER', function () {
                const session = sessions.getSession(socket);
                if (session) {
                    session.isConnected = true;
                    logger_1.default.debug(`User ${session.username} connected player to ${session.room}. `);
                    emitProfileUpdated(socket, session);
                }
            });
            socket.on('DISCONNECT_PLAYER', function () {
                const session = sessions.getSession(socket);
                if (session) {
                    session.isConnected = false;
                    logger_1.default.debug(`User ${session.username} disconnected player from ${session.room}. `);
                    emitProfileUpdated(socket, session);
                }
            });
            function joinRoom(session, room) {
                const { username } = session;
                const alreadyInRoom = session.room && session.room === room;
                if (alreadyInRoom) {
                    logger_1.default.debug(`User ${username} already in room ${room}. `);
                    return;
                }
                if (session.room) {
                    logger_1.default.debug(`User ${username} left room ${session.room}`);
                    socket.leave(session.room);
                }
                logger_1.default.debug(`User ${username} joined room ${room}`);
                session.room = room;
                socket.join(room);
                emitProfileUpdated(socket, session);
                emitRoomMembersUpdated(sockets, room);
            }
            function leaveRoom(session) {
                const { room } = session;
                const { username } = session;
                socket.leave(room);
                logger_1.default.debug(`User ${username} left ${room}.`);
                emitRoomMembersUpdated(sockets, room);
            }
        });
    }
    updateAndSchedule(sockets);
    return sockets;
};
function updateAndSchedule(sockets) {
    setTimeout(() => {
        updatePlayers(sockets)
            .then(function () {
            updateAndSchedule(sockets);
        })
            .catch(logger_1.default.error);
    }, ms_1.default('2s'));
}
function updatePlayers(sockets) {
    return __awaiter(this, void 0, void 0, function* () {
        const sessionsPlaying = sessions
            .getSessions()
            .filter(session => session.username === session.room);
        logger_1.default.debug(`Sessions playing: ${sessionsPlaying.length}`);
        yield bluebird_1.default.map(sessionsPlaying, function (session) {
            return __awaiter(this, void 0, void 0, function* () {
                const { username } = session;
                const { room } = session;
                const user = yield user_1.updateUser(username);
                if (user) {
                    session.currentPlayer = user.currentPlayer;
                    const playerContext = getPlayerContext(session);
                    emitPlayerUpdated(sockets, room, playerContext);
                    const sessionsListening = sessions
                        .getSessions()
                        .filter(s => s.username !== room && s.room === room && s.isConnected);
                    logger_1.default.debug(`Sessions listening to ${username}: ${sessionsListening.length}`);
                    yield synchronizeListeners(sockets, sessionsListening, user.currentPlayer);
                }
            });
        });
    });
}
function synchronizeListeners(sockets, sessionsListening, player) {
    return __awaiter(this, void 0, void 0, function* () {
        yield bluebird_1.default.map(sessionsListening, function (session) {
            return __awaiter(this, void 0, void 0, function* () {
                const { username } = session;
                const user = yield user_1.updateUser(username);
                if (user && user.currentPlayer) {
                    const isPlayingSameSong = user.currentPlayer.item.uri === player.item.uri;
                    const isTooApart = Math.abs(user.currentPlayer.progressMS - player.progressMS) > ms_1.default('4s');
                    const shouldPlay = player.isPlaying && (!isPlayingSameSong || isTooApart);
                    const shouldPause = !player.isPlaying && user.currentPlayer.isPlaying;
                    debug({ username, isPlayingSameSong, isTooApart, shouldPlay, shouldPause });
                    if (shouldPlay)
                        yield spotify.play(user, player.item.uri, player.progressMS);
                    if (shouldPause)
                        yield spotify.pause(user);
                }
            });
        });
    });
}
function sessionToJSON(session) {
    const { isConnected } = session;
    const { username } = session;
    const { name } = session;
    return { username, name, isConnected };
}
function sessionToProfileJSON(session) {
    const json = Object.assign(Object.assign({}, sessionToJSON(session)), { room: session.room });
    return json;
}
function getPlayerContext(session) {
    return {
        session: sessionToJSON(session),
        player: playerToJSON(session.currentPlayer)
    };
}
function playerToJSON(player) {
    if (player && player.item) {
        const trackName = player.item.name;
        const trackProgress = player.progressMS * 100 / player.item.duration_ms;
        const albumName = player.item.album.name;
        const artistName = player.item.artists.map(a => a.name).join(', ');
        const albumCoverURL = player.item.album.images[0].url;
        const isPlaying = player.isPlaying;
        return { trackProgress, trackName, artistName, albumName, albumCoverURL, isPlaying };
    }
    else
        return null;
}
function getMembers(clients) {
    return clients.map(socketId => {
        const session = sessions.getSession(socketId);
        if (session)
            return sessionToJSON(session);
        else
            return null;
    }).filter(Boolean);
}
function emitRoomMembersUpdated(sockets, room) {
    sockets.in(room).clients(function (error, clients) {
        if (error)
            throw error;
        const members = getMembers(clients);
        sockets.in(room).emit('MEMBERS_UPDATED', { members });
    });
}
function emitProfileUpdated(socket, session) {
    socket.emit('PROFILE_UPDATED', { profile: sessionToProfileJSON(session) });
}
function emitPlayerUpdated(sockets, room, playerContext) {
    sockets.in(room).emit('PLAYER_UPDATED', playerContext);
}
//# sourceMappingURL=io.js.map