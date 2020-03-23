const chai = require("chai");
const Bluebird = require("bluebird");
const assert = chai.assert;

import Client from "../dist/client";
import Server from "../dist/server";

describe("spotcast api", () => {
  let server;
  let client;

  before(async function createServer() {
    server = new Server();
    await server.listen(3000);
  });

  describe("client connects to server", function() {
    let connectedData;
    let client;

    before(function connectToServer(done) {
      client = new Client("http://localhost:3000");
      client.on("connected", data => {
        connectedData = data;
        done();
      });

      client.connect();
    });

    it("has a status equal to Connected", function() {
      assert.equal(client.status, "Connected");
    });

    describe("connected payload", function() {
      it("includes a userId", function() {
        assert(connectedData.userId);
      });
    });
  });

  describe("client connects to server when another client is also connected", function() {
    let anotherClient;
    let client;
    let connectedData;

    before(async function connectToServer() {
      anotherClient = new Client("http://localhost:3000");
      anotherClient.on("user-connected", data => {
        connectedData = data;
      });
      await anotherClient.connect();

      client = new Client("http://localhost:3000");
      await client.connect();
      await Bluebird.delay(200);
    });

    describe("another client", function() {
      describe("receiving user-connected event", function() {
        it("should include the userId of the new client", function() {
          assert(connectedData.userId);
          assert.equal(client.userId, connectedData.userId);
        });
      });
    });
  });

  after(async function stopServer() {
    await server.stop();
  });
});
