import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import * as net from "net";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (message: string) => {
    console.log("received: %s", message);
    ws.send(`Hello, you sent -> ${message}`);
  });

  ws.send("Hi there, I am a WebSocket server");
});

server.listen(process.env.PORT || 8999, () => {
  const { port } = server.address() as net.AddressInfo;
  console.log(`Server started on port ${port} :)`);
});
