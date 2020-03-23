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
    listen(port) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.httpServer.listen(port);
                this.httpServer
                    .on('listening', () => resolve(this.httpServer))
                    .on('error', reject);
            });
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.httpServer.close();
            yield new Promise(resolve => setTimeout(resolve, 1000));
        });
    }
}
exports.default = Server;
//# sourceMappingURL=index.js.map