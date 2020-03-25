const Server = require('../../dist/server').default;
const http = require('http');
const express = require('express');

let app;    // express server
let server; // fogon server

module.exports = {
  async startServer() {
    app = express();
    if (!app._listenPromise) {
      app._listenPromise = new Promise(function(resolve, reject) {
        const httpServer = http.createServer(app);
        server = new Server(httpServer);

        httpServer.listen(3000);
        httpServer
          .on('listening', () => resolve())
          .on('error', reject);
      });

    }
    await app._listenPromise;
  },
  async stopServer() {
    const httpServer = await app._listenPromise;
    if (httpServer) {
      httpServer.close();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  },
  getServer() {
    return server;
  }
};
