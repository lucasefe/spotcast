import * as spotify              from './spotify';
import { updateUser, UserModel } from './models/user';
import Bluebird                  from 'bluebird';
import http                      from 'http';
import initSessions              from './ioSession';
import logger                    from './util/logger';
import ms                        from 'ms';
import SessionStore, { Session } from './session_store';
import sio                       from 'socket.io';


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
          emitProfileUpdated(socket, session);
        }
      });

      socket.on('DISCONNECT_PLAYER', function() {
        const session = sessions.getSession(socket);
        if (session) {
          session.isConnected = false;
          logger.debug(`User ${session.username} disconnected player from ${session.room}. `);
          emitProfileUpdated(socket, session);
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

        emitProfileUpdated(socket, session);
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

  updateAndSchedule(sockets);
  return sockets;
};

function updateAndSchedule(sockets): void {
  setTimeout(() => {
    updatePlayers(sockets)
      .then(function() {
        updateAndSchedule(sockets);
      });
  }, ms('2s'));
}


async function updatePlayers(sockets): Promise<void> {
  const sessionsPlaying = sessions
    .getSessions()
    .filter(session => session.username === session.room);

  logger.debug(`Sessions playing: ${sessionsPlaying.length}`);
  await Bluebird.map(sessionsPlaying, async function(session) {
    const { username } = session;
    const { room }     = session;
    const user         = await updateUser(username);
    if (user) {
      session.currentPlayer = user.currentPlayer;
      const playerContext   = getPlayerContext(session);
      emitPlayerUpdated(sockets, room, playerContext);

      const sessionsListening = sessions
        .getSessions()
        .filter(s => s.username !== room && s.room === room && s.isConnected);

      logger.debug(`Sessions listening to ${username}: ${sessionsListening.length}`);
      await synchronizeListeners(sockets, sessionsListening, user.currentPlayer);
    }
  });
}

async function synchronizeListeners(sockets, sessionsListening, player): Promise<void> {
  await Bluebird.map(sessionsListening, async function(session) {
    const { username } = session;
    const user         = await updateUser(username);
    if (user && user.currentPlayer) {
      if (player.isPlaying)
        await spotify.play(user, player.item.uri, player.progressMS);
      else
        await spotify.pause(user);
    }
  });
}

interface SessionResponse {
  username: string;
  name: string;
  isConnected: boolean;
}


interface ProfileResponse extends SessionResponse {
  room: string;
}


function sessionToJSON(session: Session): SessionResponse {
  const { isConnected } = session;
  const { username }    = session;
  const { name }        = session;

  return { username, name, isConnected };
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


function emitProfileUpdated(socket, session): void {
  socket.emit('PROFILE_UPDATED', { profile: sessionToProfileJSON(session) });
}


function emitPlayerUpdated(sockets, room, playerContext): void {
  sockets.in(room).emit('PLAYER_UPDATED', playerContext);
}
