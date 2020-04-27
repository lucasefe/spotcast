"use strict";
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
const http = __importStar(require("http"));
const connect_mongodb_session_1 = __importDefault(require("connect-mongodb-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const ejs_1 = __importDefault(require("ejs"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
/* eslint-disable camelcase */
require('../lib/router_with_promises');
function configureServer() {
    const mongoURI = process.env.MONGODB_URI ?
        process.env.MONGODB_URI :
        'mongodb://localhost:27017/fogon';
    mongoose_1.default.connect(mongoURI, {
        useNewUrlParser: true
    });
    const app = express_1.default();
    const MongoStore = connect_mongodb_session_1.default(express_session_1.default);
    const store = new MongoStore({
        uri: 'mongodb://localhost:27017/fogon',
        collection: 'sessions'
    });
    app.use(express_1.default.static(`${__dirname}/../public`));
    app.use(cors_1.default());
    app.use(cookie_parser_1.default());
    app.use(express_session_1.default({
        key: 'fogon.session',
        name: 'fogon.session',
        secret: 'cats',
        proxy: true,
        resave: false,
        saveUninitialized: false,
        store
    }));
    app.use(body_parser_1.default.urlencoded({ extended: false }));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    app.set('views', './public');
    app.use(morgan_1.default('combined'));
    app.engine('html', ejs_1.default.renderFile);
    app.set('view engine', 'html');
    app.use(auth.routes);
    app.get('/:username', auth.secured, function (req, res) {
        console.log(`username is ${req.params.username}`);
        res.render('index.html');
    });
    const httpServer = http.createServer(app);
    require('./io').initialize(httpServer);
    return httpServer;
}
exports.default = configureServer;
//# sourceMappingURL=index.js.map