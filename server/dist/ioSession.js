"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_mongodb_session_1 = __importDefault(require("connect-mongodb-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const logger_1 = __importDefault(require("./util/logger"));
const passport_1 = __importDefault(require("passport"));
const passport_socketio_1 = __importDefault(require("passport.socketio"));
function default_1(sockets) {
    const MongoStore = connect_mongodb_session_1.default(express_session_1.default);
    const mongoURI = process.env.MONGODB_URI ?
        process.env.MONGODB_URI :
        'mongodb://localhost:27017/fogon';
    const store = new MongoStore({
        uri: mongoURI,
        collection: 'sessions'
    });
    sockets.use(passport_socketio_1.default.authorize({
        key: 'fogon.session',
        name: 'fogon.session',
        secret: 'cats',
        proxy: true,
        resave: false,
        saveUninitialized: false,
        store,
        passport: passport_1.default,
        cookieParser: cookie_parser_1.default,
        success: onAuthorizeSuccess,
        fail: onAuthorizeFail
    }));
}
exports.default = default_1;
function onAuthorizeSuccess(data, accept) {
    logger_1.default.debug('successful connection to socket.io');
    // If you use socket.io@1.X the callback looks different
    accept();
}
function onAuthorizeFail(data, message, error, accept) {
    if (error)
        throw new Error(message);
    logger_1.default.warn('failed connection to socket.io:', message);
    // We use this callback to log all of our failed connections.
    accept(null, false);
    // OR
    // If you use socket.io@1.X the callback looks different
    // If you don't want to accept the connection
    if (error)
        accept(new Error(message));
    // this error will be sent to the user as a special error-package
    // see: http://socket.io/docs/client-api/#socket > error-object
}
//# sourceMappingURL=ioSession.js.map