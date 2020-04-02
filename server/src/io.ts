import sio from 'socket.io'
import logger from './util/logger'
import http from 'http'


exports.initialize = function (httpServer: http.Server) {
  const sockets = sio(httpServer) as sio.Server;
  if (sockets) {
    sockets.on('connection', (socket: any) => {
      logger.debug(`A user connected with ${socket.id}`);
    })
  }

  return sockets;
};