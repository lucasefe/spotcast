import * as spotify              from './spotify';
import { findUser, updateUser }  from './models/user';
import Bluebird                  from 'bluebird';
import Debug                     from 'debug';
import http                      from 'http';
import initSessions              from './ioSession';
import logger                    from './util/logger';
import ms                        from 'ms';
import rollbar                   from '../lib/rollbar';
import SessionStore, { Session } from './session_store';
import sio                       from 'socket.io';

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
          sessions.removeSession(socket);

          if (session.room)
            leaveRoom(session);
        }
      });

      socket.on('JOIN', function({ room }) {
        const session = sessions.getSession(socket);
        if (session)
          joinRoom(session, room);
      });

      socket.on('CONNECT_PLAYER', function() {
        const session = sessions.getSession(socket);
        if (session) {
          session.isConnected = true;
          logger.debug(`User ${session.username} connected player to ${session.room}. `);
          emitSessionUpdated(session);
        }
      });

      socket.on('DISCONNECT_PLAYER', function() {
        const session = sessions.getSession(socket);
        if (session) {
          session.isConnected = false;
          logger.debug(`User ${session.username} disconnected player from ${session.room}. `);
          emitSessionUpdated(session);
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

        logger.debug(`User ${username} joined room ${room}`);
        session.room = room;
        socket.join(room);

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
  const sessionsPlaying = sessions
    .getSessions()
    .filter(isPlaying);
  logger.debug(`Sessions playing: ${sessionsPlaying.length}`);

  const sessionsListening = sessions
    .getSessions()
    .filter(isListening);

  logger.debug(`Sessions listening ${sessionsListening.length}`);
  const activeSessions = [ ...sessionsPlaying, ...sessionsListening ];
  await Bluebird.map(activeSessions, updateSession, { concurrency: 10 });

  await Bluebird.map(sessionsPlaying, async function(session) {
    const { username }    = session;
    const { room }        = session;
    const user            = await findUser(username);
    session.currentPlayer = user.currentPlayer;
    const playerContext   = getPlayerContext(session);
    emitPlayerUpdated(sockets, room, playerContext);

    await synchronizeListeners(sockets, sessionsListening, user.currentPlayer);
  });
}

function isPlaying(session): boolean {
  return session.username === session.room;
}

function isListening(session): boolean {
  return session.username !== session.room;
}

async function updateSession(session): Promise<void> {
  const { username } = session;
  const user         = await updateUser(username);
  const canPlay      = !!(user && user.currentPlayer && user.currentPlayer.device);
  debug({ username, canPlay });
  const statusChanged   = session.canPlay !== canPlay;
  session.canPlay       = canPlay;
  session.currentPlayer = user.currentPlayer;

  if (statusChanged)
    emitSessionUpdated(session);

}

async function synchronizeListeners(sockets, sessionsListening, player): Promise<void> {
  await Bluebird.map(sessionsListening, async function(session) {
    const { username } = session;
    const user         = await findUser(username);
    if (session.canPlay && session.isConnected) {
      const isPlayingSameSong = session.currentPlayer.item.uri === player.item.uri;
      const isTooApart        = Math.abs(session.currentPlayer.progressMS - player.progressMS) > ms('4s');
      const shouldPlay        = player.isPlaying && (!isPlayingSameSong || isTooApart);
      const shouldPause       = !player.isPlaying && session.currentPlayer.isPlaying;

      debug({ username, isPlayingSameSong, isTooApart, shouldPlay, shouldPause });

      if (shouldPlay)
        await spotify.play(user, player.item.uri, player.progressMS);
      else if (shouldPause)
        await spotify.pause(user);
    }
  });
}

interface SessionResponse {
  username: string;
  name: string;
  isConnected: boolean;
  canPlay: boolean;
}


interface ProfileResponse extends SessionResponse {
  room: string;
}


function sessionToJSON(session: Session): SessionResponse {
  const { isConnected } = session;
  const { canPlay }     = session;
  const { username }    = session;
  const { name }        = session;

  return { username, name, isConnected, canPlay };
}


function sessionToProfileJSON(session): ProfileResponse {
  const json = {
    ...sessionToJSON(session),
    room:        session.room
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


interface PlayerContext {
  session: SessionResponse;
  player: PlayerResponse|null;
}


function getPlayerContext(session: Session): PlayerContext|null {
  return {
    session: sessionToJSON(session),
    player:  playerToJSON(session.currentPlayer)
  };
}


function playerToJSON(player: spotify.CurrentPlayer|undefined): PlayerResponse|null {
  if (player && player.item) {
    const trackName     = player.item.name;
    const trackProgress = player.progressMS * 100 / player.item.duration_ms;

    const albumName     = player.item.album.name;
    const artistName    = player.item.artists.map(a => a.name).join(', ');
    const albumCoverURL = player.item.album.images[0].url;
    const isPlaying     = player.isPlaying;

    return { trackProgress, trackName, artistName, albumName, albumCoverURL, isPlaying };
  } else
    return null;
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


function emitPlayerUpdated(sockets, room, playerContext): void {
  sockets.in(room).emit('PLAYER_UPDATED', playerContext);
}

function emitSessionError(session, errorMessage): void {
  const socket = session.socket;
  socket.emit('PLAYER_ERROR', { errorMessage  });
}
