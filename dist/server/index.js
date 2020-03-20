"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        console.log("received: %s", message);
        ws.send(`Hello, you sent -> ${message}`);
    });
    ws.send("Hi there, I am a WebSocket server");
});
server.listen(process.env.PORT || 8999, () => {
    const { port } = server.address();
    console.log(`Server started on port ${port} :)`);
});
//# sourceMappingURL=index.js.map