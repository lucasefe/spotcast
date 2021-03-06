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
const config_1 = require("../config");
const connect_mongodb_session_1 = __importDefault(require("connect-mongodb-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const ejs_1 = __importDefault(require("ejs"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const rollbar_1 = __importDefault(require("../lib/rollbar"));
const express_session_1 = __importDefault(require("express-session"));
/* eslint-disable camelcase */
require('../lib/router_with_promises');
function configureServer() {
    config_1.configure();
    const app = express_1.default();
    const MongoStore = connect_mongodb_session_1.default(express_session_1.default);
    const store = new MongoStore({
        uri: config_1.getMongoURI(),
        collection: 'sessions'
    });
    app.use(rollbar_1.default.errorHandler());
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
        res.render('index.html');
    });
    const httpServer = http.createServer(app);
    require('./io').initialize(httpServer); /* eslint-disable-line global-require */
    return httpServer;
}
exports.default = configureServer;
//# sourceMappingURL=index.js.map