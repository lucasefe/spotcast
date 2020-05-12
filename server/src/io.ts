import { v4 as uuid }                        from 'uuid';
import Debug                                 from 'debug';
import http                                  from 'http';
import initSessions                          from './io_sessions';
import logger                                from './util/logger';
import SessionStore, { Session }             from './session_store';
import sio                                   from 'socket.io';

const debug = Debug('io');

exports.initialize = function(httpServer: http.Server, sessions: SessionStore): sio.Server {
  logger.info('initializing socket server');
  const sockets = sio(httpServer) as sio.Server;

  initSessions(sockets);

  if (sockets) {
    sockets.on('connection', (socket: any) => {
      debug(`Socket id created: ${socket.id}`);

      if (socket.request.user && socket.request.user.logged_in) {
        const { user } = socket.request;
        const session  = sessions.createOrUpdateSession(socket, user);

        debug(`User ${user.username} connected.`);
        joinRoom(session, session.username);
      }

      socket.on('disconnect', function() {
        debug(`Socket id destroyed: ${socket.id}`);

        const session = sessions.getSession(socket);
        if (session) {
          const { username } = session;
          logger.debug(`User ${username} disconnected`);

          if (session.isListening)
            disconnectPlayer(session);
          else {
            const wasPlaying = session.currentlyPlaying && session.currentlyPlaying.isPlaying;
            if (wasPlaying)
              disconnectListeners(sockets, sessions, session.room);
          }

          if (session.room)
            leaveRoom(session);

          sessions.removeSession(socket);
        }
      });

      socket.on('JOIN', function({ room }) {
        const session = sessions.getSession(socket);
        if (session)
          joinRoom(session, room);
      });


      socket.on('SEND_MESSAGE', function({ text }) {
        const session = sessions.getSession(socket);
        if (session) {
          emitNewMessage(sockets, session.room, {
            id:        uuid(),
            timestamp: new Date().toISOString(),
            from:      session.name,
            text
          });
        }
      });

      socket.on('CONNECT_PLAYER', function() {
        const session = sessions.getSession(socket);
        if (session) {
          connectPlayer(session);
          emitRoomMembersUpdated(sockets, sessions, session.room);
        }
      });

      socket.on('DISCONNECT_PLAYER', function() {
        const session = sessions.getSession(socket);
        if (session) {
          disconnectPlayer(session);
          emitRoomMembersUpdated(sockets, sessions, session.room);
        }
      });

      function joinRoom(session: Session, room: string): void {
        const { username }  = session;
        const alreadyInRoom = session.room && session.room === room;
        if (alreadyInRoom) {
          debug(`User ${username} already in room ${room}. `);
          return;
        }

        if (session.room) {
          debug(`User ${username} left room ${session.room}`);
          socket.leave(session.room);
        }

        // if user was connected, let's reset it.
        session.isListening = false;

        session.room = room;
        socket.join(room);
        debug(`User ${username} joined room ${room}`);

        emitSessionUpdated(session);
        emitRoomMembersUpdated(sockets, sessions, room);
      }

      function leaveRoom(session: Session): void {
        const { room }     = session;
        const { username } = session;

        socket.leave(room);
        logger.debug(`User ${username} left ${room}.`);
        emitRoomMembersUpdated(sockets, sessions, room);
      }
    });
  }

  return sockets;
};



interface SessionResponse {
  username: string;
  name: string;
  isListening: boolean;
  canPlay: boolean;
}


interface ProfileResponse extends SessionResponse {
  room: string;
  product: string;
}


function sessionToJSON(session: Session): SessionResponse {
  const { isListening } = session;
  const { canPlay }     = session;
  const { username }    = session;
  const { name }        = session;

  return { username, name, isListening, canPlay };
}


function sessionToProfileJSON(session): ProfileResponse {
  const json = {
    ...sessionToJSON(session),
    room:    session.room,
    product: session.product
  };

  return json;
}




interface SessionErrorMessage {
  name: string;
  message: string;
}





function getMembers(clients, sessions): Array<SessionResponse> {
  return clients.map(socketId => {
    const session = sessions.getSession(socketId);
    if (session)
      return sessionToJSON(session);
    else
      return null;
  }).filter(Boolean);
}


export function emitRoomMembersUpdated(sockets, sessions, room): void {
  sockets.in(room).clients(function(error, clients) {
    if (error)
      throw error;

    const members = getMembers(clients, sessions);
    sockets.in(room).emit('MEMBERS_UPDATED', { members });
  });
}

export function emitSessionUpdated(session): void {
  session.socket.emit('SESSION_UPDATED', { profile: sessionToProfileJSON(session) });
}

export function emitSessionError(session, error: SessionErrorMessage): void {
  session.socket.emit('SESSION_ERROR', { error });
}

export function emitPlayerUpdated(sockets, room, playerContext): void {
  sockets.in(room).emit('PLAYER_UPDATED', playerContext);
}

export function emitNewMessage(sockets, room, message): void {
  sockets.in(room).emit('NEW_MESSAGE', { message });
}

export function getListeningSessions(sessions, room): Array<Session> {
  return sessions.getSessions()
    .filter(session => session.username !== session.room)
    .filter(s => s.room === room);
}

function connectPlayer(session): void {
  if (session.isListening) {
    logger.warn(`User ${session.username} already connected player to ${session.room}. `);
    return;
  }

  if (session.canPlay) {
    session.isListening = true;
    debug(`User ${session.username} connected player to ${session.room}. `);
    emitSessionUpdated(session);
  } else
    emitSessionError(session, { name: 'CannotPlay', message: 'You cannot connect because your player is off, or it is not playing anything.' });

}

export function disconnectPlayer(session): void {
  session.isListening = false;
  debug(`User ${session.username} disconnected player from ${session.room}. `);
  emitSessionUpdated(session);
}

function disconnectListeners(sockets, sessions, room): void {
  const sessionStoppedError = {
    name:    'SessionStopped',
    message: `Session ${room} stopped. `
  };

  getListeningSessions(sessions, room)
    .map(session => {
      disconnectPlayer(session);
      emitSessionError(session, sessionStoppedError);
    });
}
