"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = __importDefault(require("socket.io-client"));
var Statuses;
(function (Statuses) {
    Statuses["connected"] = "Connected";
    Statuses["disconnected"] = "Disconnected";
})(Statuses || (Statuses = {}));
class Client {
    constructor(url, done) {
        this.status = Statuses.disconnected;
        this.socket = socket_io_client_1.default(url);
        this.socket.on('connect', () => {
            this.status = Statuses.connected;
            done();
        });
    }
}
exports.default = Client;
//# sourceMappingURL=index.js.map