"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston = __importStar(require("winston"));
const alignColorsAndTime = winston.format.combine(winston.format.colorize({ all: true }), winston.format.timestamp({ format: 'YY-MM-DD HH:mm:ss' }), winston.format.printf(line => `${line.timestamp} ${line.level} : ${line.message}`));
const consoleLogger = new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(winston.format.colorize(), alignColorsAndTime)
});
const logger = winston.createLogger({
    transports: [consoleLogger]
});
logger.exitOnError = false;
exports.default = logger;
//# sourceMappingURL=logger.js.map