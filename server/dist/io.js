"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const debug_1 = __importDefault(require("debug"));
const io_sessions_1 = __importDefault(require("./io_sessions"));
const logger_1 = __importDefault(require("./util/logger"));
const socket_io_1 = __importDefault(require("socket.io"));
const debug = debug_1.default('io');
exports.initialize = function (httpServer, sessions) {
    logger_1.default.info('initializing socket server');
    const sockets = socket_io_1.default(httpServer);
    io_sessions_1.default(sockets);
    if (sockets) {
        sockets.on('connection', (socket) => {
            debug(`Socket id created: ${socket.id}`);
            if (socket.request.user && socket.request.user.logged_in) {
                const { user } = socket.request;
                const session = sessions.createOrUpdateSession(socket, user);
                debug(`User ${user.username} connected.`);
                joinRoom(session, session.username);
            }
            socket.on('disconnect', function () {
                debug(`Socket id destroyed: ${socket.id}`);
                const session = sessions.getSession(socket);
                if (session) {
                    const { username } = session;
                    logger_1.default.debug(`User ${username} disconnected`);
                    if (session.isListening)
                        disconnectPlayer(session);
                    else {
                        const wasPlaying = session.currentlyPlaying && session.currentlyPlaying.isPlaying;
                        if (wasPlaying)
                            disconnectListeners(sockets, sessions, session.room);
                    }
                    if (session.room)
                        leaveRoom(session);
                    sessions.removeSession(socket);
                }
            });
            socket.on('JOIN', function ({ room }) {
                const session = sessions.getSession(socket);
                if (session)
                    joinRoom(session, room);
            });
            socket.on('SEND_MESSAGE', function ({ text }) {
                const session = sessions.getSession(socket);
                if (session) {
                    emitNewMessage(sockets, session.room, {
                        id: uuid_1.v4(),
                        timestamp: new Date().toISOString(),
                        from: session.name,
                        text
                    });
                }
            });
            socket.on('CONNECT_PLAYER', function () {
                const session = sessions.getSession(socket);
                if (session) {
                    connectPlayer(session);
                    emitRoomMembersUpdated(sockets, sessions, session.room);
                }
            });
            socket.on('DISCONNECT_PLAYER', function () {
                const session = sessions.getSession(socket);
                if (session) {
                    disconnectPlayer(session);
                    emitRoomMembersUpdated(sockets, sessions, session.room);
                }
            });
            function joinRoom(session, room) {
                const { username } = session;
                const alreadyInRoom = session.room && session.room === room;
                if (alreadyInRoom) {
                    debug(`User ${username} already in room ${room}. `);
                    return;
                }
                if (session.room) {
                    debug(`User ${username} left room ${session.room}`);
                    socket.leave(session.room);
                }
                // if user was connected, let's reset it.
                session.isListening = false;
                session.room = room;
                socket.join(room);
                debug(`User ${username} joined room ${room}`);
                emitSessionUpdated(session);
                emitRoomMembersUpdated(sockets, sessions, room);
            }
            function leaveRoom(session) {
                const { room } = session;
                const { username } = session;
                socket.leave(room);
                logger_1.default.debug(`User ${username} left ${room}.`);
                emitRoomMembersUpdated(sockets, sessions, room);
            }
        });
    }
    return sockets;
};
function sessionToJSON(session) {
    const { isListening } = session;
    const { canPlay } = session;
    const { username } = session;
    const { name } = session;
    return { username, name, isListening, canPlay };
}
function sessionToProfileJSON(session) {
    const json = Object.assign(Object.assign({}, sessionToJSON(session)), { room: session.room, product: session.product });
    return json;
}
function getMembers(clients, sessions) {
    return clients.map(socketId => {
        const session = sessions.getSession(socketId);
        if (session)
            return sessionToJSON(session);
        else
            return null;
    }).filter(Boolean);
}
function emitRoomMembersUpdated(sockets, sessions, room) {
    sockets.in(room).clients(function (error, clients) {
        if (error)
            throw error;
        const members = getMembers(clients, sessions);
        sockets.in(room).emit('MEMBERS_UPDATED', { members });
    });
}
exports.emitRoomMembersUpdated = emitRoomMembersUpdated;
function emitSessionUpdated(session) {
    session.socket.emit('SESSION_UPDATED', { profile: sessionToProfileJSON(session) });
}
exports.emitSessionUpdated = emitSessionUpdated;
function emitSessionError(session, error) {
    session.socket.emit('SESSION_ERROR', { error });
}
exports.emitSessionError = emitSessionError;
function emitPlayerUpdated(sockets, room, playerContext) {
    sockets.in(room).emit('PLAYER_UPDATED', playerContext);
}
exports.emitPlayerUpdated = emitPlayerUpdated;
function emitNewMessage(sockets, room, message) {
    sockets.in(room).emit('NEW_MESSAGE', { message });
}
exports.emitNewMessage = emitNewMessage;
function getListeningSessions(sessions, room) {
    return sessions.getSessions()
        .filter(session => session.username !== session.room)
        .filter(s => s.room === room);
}
exports.getListeningSessions = getListeningSessions;
function connectPlayer(session) {
    if (session.isListening) {
        logger_1.default.warn(`User ${session.username} already connected player to ${session.room}. `);
        return;
    }
    if (session.canPlay) {
        session.isListening = true;
        debug(`User ${session.username} connected player to ${session.room}. `);
        emitSessionUpdated(session);
    }
    else
        emitSessionError(session, { name: 'CannotPlay', message: 'You cannot connect because your player is off, or it is not playing anything.' });
}
function disconnectPlayer(session) {
    session.isListening = false;
    debug(`User ${session.username} disconnected player from ${session.room}. `);
    emitSessionUpdated(session);
}
exports.disconnectPlayer = disconnectPlayer;
function disconnectListeners(sockets, sessions, room) {
    const sessionStoppedError = {
        name: 'SessionStopped',
        message: `Session ${room} stopped. `
    };
    getListeningSessions(sessions, room)
        .map(session => {
        disconnectPlayer(session);
        emitSessionError(session, sessionStoppedError);
    });
}
//# sourceMappingURL=io.js.map