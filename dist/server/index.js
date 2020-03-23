"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http = __importStar(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
class Server {
    constructor() {
        this.app = express_1.default();
        this.httpServer = http.createServer(this.app);
        this.sockets = socket_io_1.default(this.httpServer);
        this.sockets.on("connection", socket => {
            socket.emit("hola");
        });
    }
    listen(port, callback) {
        this.httpServer.listen(port, callback);
    }
}
exports.default = Server;
//# sourceMappingURL=index.js.map