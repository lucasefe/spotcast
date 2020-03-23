const chai = require('chai');
const assert = chai.assert;

import Client from "../dist/client";
import Server from "../dist/server";

describe("Server", () => {
  describe("Socket", () => {
    let server;
    let client;
    let connectedData;

    before(async function createServer() {
      server = new Server()
      await server.listen(3000)
    })

    before(function connectToServer(done) {
      client = new Client("http://localhost:3000")

      client.on('connected', (data) => {
        connectedData = data
        done()
      });
      
      client.connect();
    })

    it("has a status equal to Connected", function() {
      assert.equal(client.status, 'Connected')
    });

    describe("connected payload", function() {
      it("has a user id", function() {
        assert(connectedData.userId);
      })
    })

    after(async function stopServer() {
      await server.stop();
    })
  });
});
