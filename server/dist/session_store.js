"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SessionStore {
    constructor() {
        this.sessions = new Map();
    }
    getSession(socket) {
        const socketId = typeof socket === 'string' ? socket : socket.id;
        const sioSession = this.sessions.get(socketId);
        return sioSession;
    }
    createOrUpdateSession(socket, user) {
        const session = this.getSession(socket);
        if (session) {
            session.username = user.username;
            session.name = user.name;
            session.isConnected = false;
            session.canPlay = false;
            session.room = undefined;
            session.product = user.product;
            return session;
        }
        else {
            const newSession = this.createSession(socket, user);
            this.sessions.set(socket.id, newSession);
            return newSession;
        }
    }
    createSession(socket, user) {
        return {
            socket,
            username: user.username,
            name: user.name,
            isConnected: false,
            canPlay: false,
            product: user.product
        };
    }
    removeSession(socket) {
        this.sessions.delete(socket.id);
    }
    getSessions() {
        return Array
            .from(this.sessions, ([_, value]) => value);
    }
}
exports.default = SessionStore;
//# sourceMappingURL=session_store.js.map