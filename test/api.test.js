import * as Bluebird from 'bluebird';
import * as Helper   from './helper';
import { assert }    from 'chai';
import Client        from '../dist/client';


describe('spotcast client -> server api', () => {
  before(Helper.startServer);

  describe('client connects', function() {
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

  describe('client connects when another client is also connected', function() {
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

  describe('playlist', function() {
    let client;
    let anotherClient;

    before(async function connectToServer() {
      anotherClient = new Client('http://localhost:3000');
      await anotherClient.connect();

      client = new Client('http://localhost:3000');
      await client.connect();
    });


    describe('get playlist', function() {
      let playlist;

      before(async function getPlaylist() {
        playlist = await client.getPlaylist();
      });

      describe('empty playlist', function() {
        it('should be empty', function() {
          assert.equal(playlist.items.length, 0);
        });
      });
    });
  });

  after(Helper.stopServer);
});
