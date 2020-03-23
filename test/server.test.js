const chai = require('chai');
const assert = chai.assert;

import Client from "../dist/client";
import Server from "../dist/server";

describe("Server", () => {
  describe("Socket", () => {
    let server;
    let client;

    before(async function createServer() {
      server = new Server()
      await server.listen(3000)
    })

    before(function connectToServer(done  ) {
      client = new Client("http://localhost:3000", done)
    })

    it("connected", function() {
      assert.equal(client.status, 'Connected')
    });

    after(async function stopServer() {
      await server.stop();
    })
  });
});
