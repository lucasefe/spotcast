import 'mocha';
import * as http       from 'http';
import * as ioClient   from 'socket.io-client';
import { assert }      from 'chai';
import { expect }      from 'chai';
import configureServer from '../../src';

const serverUrl = 'http://localhost:5000';

const options: SocketIOClient.ConnectOpts = {
  transports: [ 'websocket' ],
  forceNew:   true
};

describe('Hello function', () => {
  let server: http.Server;
  let client: SocketIOClient.Socket;

  before(function(done) {
    server = configureServer();
    server.listen(5000, done);
    client = ioClient.connect(serverUrl, options);
  });

  describe('connect', () => {
    it('should connect socket', (done: Function) => {
      client.on('connect', () => {
        assert.equal(client.connected, true);
        client.disconnect();
        done();
      });
    });
  });


  after(function() {
    server.close();
  });

});
