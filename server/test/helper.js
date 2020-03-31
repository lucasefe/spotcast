const configureServer = require('../dist/server').default;
const server = configureServer();

module.exports = {
  async startServer() {
    if (!server._listenPromise) {
      server._listenPromise = new Promise(function(resolve, reject) {
        server.listen(3000);
        server
          .on('listening', () => resolve())
          .on('error', reject);
      });

    }
    await server._listenPromise;
  },

  async stopServer() {
    const listener = await server._listenPromise;
    if (listener) {
      listener.close();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};
