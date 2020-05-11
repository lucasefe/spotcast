"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird_1 = __importDefault(require("bluebird"));
const debug_1 = __importDefault(require("debug"));
const logger_1 = __importDefault(require("../util/logger"));
const mongoose_1 = __importDefault(require("mongoose"));
const debug = debug_1.default('mongo');
bluebird_1.default.config({
    // As much as we like to be warned about our runaway promises, most of the
    // offending code lives in libraries we use. We still need to make sense
    // of our logs.
    warnings: false
});
mongoose_1.default.Promise = global.Promise;
function getMongoURI() {
    switch (process.env.NODE_ENV) {
        case 'production': {
            if (process.env.MONGODB_URI)
                return process.env.MONGODB_URI;
            else
                throw new Error('MONGODB_URI not defined');
        }
        case 'test': {
            const host = process.env.MONGODB_HOST || 'localhost';
            const port = process.env.MONGODB_PORT || 27017;
            return `mongodb://${host}:${port}/test-fogon`;
        }
        default: {
            const host = process.env.MONGODB_HOST || 'localhost';
            const port = process.env.MONGODB_PORT || 27017;
            return `mongodb://${host}:${port}/broadly`;
        }
    }
}
exports.getMongoURI = getMongoURI;
function configure() {
    const uri = getMongoURI();
    const Logger = mongoose_1.default.mongo.Logger;
    mongoose_1.default.connection
        .on('connected', function () {
        logger_1.default.info(`MongoDB: connected to ${uri}`);
    })
        .on('disconnected', function () {
        logger_1.default.warn('MongoDB: disconnected');
    })
        .on('reconnected', function () {
        logger_1.default.warn(`MongoDB: reconnected to ${uri}`);
    })
        .on('fullsetup', function () {
        logger_1.default.info('MongoDB: fullsetup');
    })
        .on('error', logger_1.default.error);
    mongoose_1.default.connect(uri, { useNewUrlParser: true });
    // Mongoose debug to Papertrail.
    mongoose_1.default.set('debug', debug);
    Logger.setLevel(debug.enabled ? 'debug' : 'warn');
}
exports.configure = configure;
//# sourceMappingURL=index.js.map