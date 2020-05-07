import * as spotify                          from './spotify';
import { findUser, updateUser }              from './models/user';
import { v4 as uuid }                        from 'uuid';
import Bluebird                              from 'bluebird';
import Debug                                 from 'debug';
import http                                  from 'http';
import initSessions                          from './io_sessions';
import logger                                from './util/logger';
import ms                                    from 'ms';
import rollbar                               from '../lib/rollbar';
import SessionStore, { Session }             from './session_store';
import sio                                   from 'socket.io';

const debug = Debug('sync');

const sessions = new SessionStore();


exports.initialize = function(httpServer: http.Server): sio.Server {
  logger.info('initializing socket server');
  const sockets = sio(httpServer) as sio.Server;

  initSessions(sockets);

  if (sockets) {
    sockets.on('connection', (socket: any) => {
      logger.debug(`Socket id created: ${socket.id}`);

      if (socket.request.user && socket.request.user.logged_in) {
        const { user } = socket.request;
        const session  = sessions.createOrUpdateSession(socket, user);

        logger.debug(`User ${user.username} connected.`);
        joinRoom(session, session.username);
      }

      socket.on('disconnect', function() {
        logger.debug(`Socket id destroyed: ${socket.id}`);

        const session = sessions.getSession(socket);
        if (session) {
          const { username } = session;
          logger.debug(`User ${username} disconnected`);

          if (session.isConnectedToRoom)
            disconnectPlayer(session);
          else {
            const wasPlaying = session.currentPlayer && session.currentPlayer.isPlaying;
            if (wasPlaying)
              disconnectListeners(sockets, session.room);
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
          emitRoomMembersUpdated(sockets, session.room);
        }
      });

      socket.on('DISCONNECT_PLAYER', function() {
        const session = sessions.getSession(socket);
        if (session) {
          disconnectPlayer(session);
          emitRoomMembersUpdated(sockets, session.room);
        }
      });

      function joinRoom(session: Session, room: string): void {
        const { username }  = session;
        const alreadyInRoom = session.room && session.room === room;
        if (alreadyInRoom) {
          logger.debug(`User ${username} already in room ${room}. `);
          return;
        }

        if (session.room) {
          logger.debug(`User ${username} left room ${session.room}`);
          socket.leave(session.room);
        }

        // if user was connected, let's reset it.
        session.isConnectedToRoom = false;

        session.room = room;
        socket.join(room);
        logger.debug(`User ${username} joined room ${room}`);

        emitSessionUpdated(session);
        emitRoomMembersUpdated(sockets, room);
      }

      function leaveRoom(session: Session): void {
        const { room }     = session;
        const { username } = session;

        socket.leave(room);
        logger.debug(`User ${username} left ${room}.`);
        emitRoomMembersUpdated(sockets, room);
      }
    });
  }

  scheduleNextPlayersUpdate(sockets);
  return sockets;
};

function scheduleNextPlayersUpdate(sockets): void {
  setTimeout(() => {
    updatePlayers(sockets)
      .finally(function() {
        scheduleNextPlayersUpdate(sockets);
      })
      .catch(error => {
        handlerError(sockets, error);
      });
  }, ms('2s'));
}

function handlerError(sockets, error): void {
  debug({ error });
  logger.error(error);
  rollbar.error(error);
}


async function updatePlayers(sockets): Promise<void> {
  const allSessions = sessions
    .getSessions();

  logger.debug(`Sessions: ${allSessions.length}`);
  await Bluebird.map(allSessions, refreshSession, { concurrency: 10 });

  const sessionsPlaying = sessions
    .getSessions()
    .filter(session => session.username === session.room);

  logger.debug(`Sessions playing: ${sessionsPlaying.length}`);
  await Bluebird.map(sessionsPlaying, async function(session) {
    await updatePlayersAndListeners(sockets, session);
  }, { concurrency: 10 });
}


async function refreshSession(session): Promise<void> {
  const { username, product } = session;
  const user                  = await updateUser(username);
  const canPlay               = !!(user && user.currentPlayer && user.currentPlayer.device);
  debug({ username, canPlay, product });
  const statusChanged = session.canPlay !== canPlay;

  session.canPlay           = canPlay;
  session.currentPlayer     = user.currentPlayer;
  session.isConnectedToRoom = canPlay && session.isConnectedToRoom;

  if (statusChanged)
    emitSessionUpdated(session);
}


async function updatePlayersAndListeners(sockets, session): Promise<void> {
  const { username } = session;
  const { room }     = session;
  const player       = getPlayerState(session);
  emitPlayerUpdated(sockets, room, player);

  const sessionsListening = getListeningSessions(room);

  logger.debug(`Sessions listening to ${username}: ${sessionsListening.length}`);
  await synchronizeListeners(sockets, sessionsListening, session.currentPlayer);
}


async function synchronizeListeners(sockets, sessionsListening, player): Promise<void> {
  await Bluebird.map(sessionsListening, async function(session) {
    const { username } = session;
    const user         = await findUser(username);
    if (session.isConnectedToRoom && session.canPlay) {
      const isPlayingSameSong = session.currentPlayer.item.uri === player.item.uri;
      const isTooApart        = Math.abs(session.currentPlayer.progressMS - player.progressMS) > ms('4s');
      const shouldPlay        = player.isPlaying && (!isPlayingSameSong || isTooApart);
      const shouldPause       = !player.isPlaying && session.currentPlayer.isPlaying;

      debug({ username, isPlayingSameSong, isTooApart, shouldPlay, shouldPause });

      try {
        if (shouldPlay)
          await spotify.play(user, player.item.uri, player.progressMS);
        else if (shouldPause)
          await spotify.pause(user);
      } catch (error) {
        if (error instanceof spotify.PlayerNotRespondingError) {
          user.set({ 'currentPlayer.lastErrorStatus': 404 });
          await user.save();
          emitSessionError(session, { name: 'PlayerNotResponding', message: 'Your player is not responding. ' });
          disconnectPlayer(session);
        }
      }
    }
  });
}

interface SessionResponse {
  username: string;
  name: string;
  isConnectedToRoom: boolean;
  canPlay: boolean;
}


interface ProfileResponse extends SessionResponse {
  room: string;
  product: string;
}


function sessionToJSON(session: Session): SessionResponse {
  const { isConnectedToRoom } = session;
  const { canPlay }           = session;
  const { username }          = session;
  const { name }              = session;

  return { username, name, isConnectedToRoom, canPlay };
}


function sessionToProfileJSON(session): ProfileResponse {
  const json = {
    ...sessionToJSON(session),
    room:    session.room,
    product: session.product
  };

  return json;
}


interface PlayerResponse {
  trackName: string;
  trackProgress: number;
  albumName: string;
  albumCoverURL: string;
  artistName: string;
  isPlaying: boolean;
}


interface PlayerStateResponse {
  player: PlayerResponse;
  session: Record<string, any>;
}

interface SessionErrorMessage {
  name: string;
  message: string;
}

function getPlayerState(session: Session): PlayerStateResponse {
  return {
    session: {
      name:     session.name,
      username: session.username
    },
    player: getPlayer(session.currentPlayer)
  };
}

function getPlayer(player): PlayerResponse {
  if (player && player.item) {
    const trackName     = player.item.name;
    const trackProgress = player.progressMS * 100 / player.item.duration_ms;
    const albumName     = player.item.album.name;
    const artistName    = player.item.artists.map(a => a.name).join(', ');
    const albumCoverURL = player.item.album.images[0].url;

    return {
      trackProgress,
      trackName,
      artistName,
      albumName,
      albumCoverURL,
      isPlaying: player.isPlaying
    };
  } else
    return player;
}


function getMembers(clients): Array<SessionResponse> {
  return clients.map(socketId => {
    const session = sessions.getSession(socketId);
    if (session)
      return sessionToJSON(session);
    else
      return null;
  }).filter(Boolean);
}


function emitRoomMembersUpdated(sockets, room): void {
  sockets.in(room).clients(function(error, clients) {
    if (error)
      throw error;

    const members = getMembers(clients);
    sockets.in(room).emit('MEMBERS_UPDATED', { members });
  });
}


function emitSessionUpdated(session): void {
  session.socket.emit('SESSION_UPDATED', { profile: sessionToProfileJSON(session) });
}


function emitSessionError(session, error: SessionErrorMessage): void {
  session.socket.emit('SESSION_ERROR', { error });
}

function emitPlayerUpdated(sockets, room, playerContext): void {
  sockets.in(room).emit('PLAYER_UPDATED', playerContext);
}

function emitNewMessage(sockets, room, message): void {
  sockets.in(room).emit('NEW_MESSAGE', { message });
}

function connectPlayer(session): void {
  if (session.isConnectedToRoom) {
    logger.warn(`User ${session.username} already connected player to ${session.room}. `);
    return;
  }

  if (session.canPlay) {
    session.isConnectedToRoom = true;
    logger.debug(`User ${session.username} connected player to ${session.room}. `);
    emitSessionUpdated(session);
  } else
    emitSessionError(session, { name: 'CannotPlay', message: 'You cannot connect because your player is off, or it is not playing anything.' });

}

function disconnectPlayer(session): void {
  session.isConnectedToRoom = false;
  logger.debug(`User ${session.username} disconnected player from ${session.room}. `);
  emitSessionUpdated(session);
}

function disconnectListeners(sockets, room): void {
  const sessionStoppedError = {
    name:    'SessionStopped',
    message: `Session ${room} stopped. `
  };

  getListeningSessions(room)
    .map(session => {
      disconnectPlayer(session);
      emitSessionError(session, sessionStoppedError);
    });
}


function getListeningSessions(room): Array<Session> {
  return sessions.getSessions()
    .filter(session => session.username !== session.room)
    .filter(s => s.room === room);
}
