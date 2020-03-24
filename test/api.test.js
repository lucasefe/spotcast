import { assert } from 'chai';
import * as Bluebird from 'bluebird';
import Client from '../dist/client';
import Server from '../dist/server';


describe('spotcast server -> client api', () => {
  let server;

  before(async function createServer() {
    server = new Server();
    await server.listen(3000);
  });

  describe('client connects to server', function() {
    let connectedData;
    let client;

    before(async function connectToServer() {
      client = new Client('http://localhost:3000');
      client.on('connected', data => {
        connectedData = data;
      });

      await client.connect();
      await Bluebird.delay(200);
    });

    describe('connected payload', function() {
      it('includes a userId', function() {
        assert(connectedData.userId);
      });
    });

    after(async function disconnectClient() {
      await client.disconnect();
    });
  });

  describe('client connects to server when another client is also connected', function() {
    let anotherClient;
    let client;
    let connectedData;

    before(async function connectToServer() {
      anotherClient = new Client('http://localhost:3000');
      anotherClient.on('user-connected', data => {
        connectedData = data;
      });
      await anotherClient.connect();

      client = new Client('http://localhost:3000');
      await client.connect();
      await Bluebird.delay(200);
    });

    describe('another client', function() {
      describe('receiving user-connected event', function() {
        it('should include the userId of the new client', function() {
          assert(connectedData.userId);
          assert.equal(client.userId, connectedData.userId);
        });
      });
    });

    describe('when client disconnects', function() {
      after(async function disconnectClient() {
        await client.disconnect();
      });

      describe('another client', function() {
        describe('receiving user-disconnected event', function() {
          it('should include the userId of the client disconnecting', function() {
            assert(connectedData.userId);
            assert.equal(client.userId, connectedData.userId);
          });
        });
      });
    });

    after(async function disconnectClient() {
      await anotherClient.disconnect();
    });
  });

  after(async function stopServer() {
    await server.stop();
  });
});
