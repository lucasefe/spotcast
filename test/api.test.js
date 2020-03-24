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
      it('includes a userID', function() {
        assert(connectedData.userID);
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
        it('should include the userID of the new client', function() {
          assert(connectedData.userID);
          assert.equal(client.userID, connectedData.userID);
        });
      });
    });

    describe('when client disconnects', function() {
      after(async function disconnectClient() {
        await client.disconnect();
      });

      describe('another client', function() {
        describe('receiving user-disconnected event', function() {
          it('should include the userID of the client disconnecting', function() {
            assert(connectedData.userID);
            assert.equal(client.userID, connectedData.userID);
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
          assert.equal(playlist.tracks.length, 0);
        });
      });
    });

    describe('add title to playlist', function() {
      let playlist;
      const trackID = '1234';

      before(async function addTrackToPlaylist() {
        client.on('playlist-updated', data => {
          playlist = data.playlist;
        });

        await client.addTrackToPlaylist(trackID);
      });

      describe('updated playlist', function() {
        it('should have one track', function() {
          assert.equal(playlist.tracks.length, 1);
        });

        it('should include the track id', function() {
          assert.equal(playlist.tracks[0].id, trackID);
        });

        it('should include the user id of the user who added it', function() {
          assert(playlist.tracks[0].userID);
          assert.equal(playlist.tracks[0].userID, client.userID);
        });
      });
    });
  });

  after(Helper.stopServer);
});
