const chai = require('chai');
const assert = chai.assert;

import Client from "../dist/client";
import Server from "../dist/server";

describe("Server", () => {
  describe("Socket", () => {
    let server;
    let client;

    before(function createServer(done) {
      server = new Server()
      server.listen(3000, function() {
        done()
      });
    })

    before(function connectToServer(done  ) {
      client = new Client("http://localhost:3000", done)
    })

    it("connected", function() {
      assert.equal(client.status, 'connected')
    });

  });
});
