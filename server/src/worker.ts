
import * as spotify                                          from './spotify';
import { disconnectPlayer }                                  from './io';
import { emitPlayerUpdated }                                 from './io';
import { emitSessionError }                                  from './io';
import { emitSessionUpdated }                                from './io';
import { findUser, updateUser }                              from './models/user';
import { getListeningSessions }                              from './io';
import { Session }                                           from './session_store';
import Bluebird                                              from 'bluebird';
import Debug                                                 from 'debug';
import logger                                                from './util/logger';
import ms                                                    from 'ms';
import rollbar                                               from '../lib/rollbar';

const debug = Debug('sync');

let isRunning = false;

export default function startWorker(sockets, sessions): StopFunc {
  isRunning = true;
  scheduleNextPlayersUpdate(sockets, sessions);

  return stopWorker;
}

interface StopFunc {
  (): void;
}

function stopWorker(): void  {
  isRunning = false;
}

function scheduleNextPlayersUpdate(sockets, sessions): void {
  setTimeout(() => {
    if (!isRunning) {
      debug('stopping worker');
      return;
    }

    updatePlayers(sockets, sessions)
      .finally(function() {
        scheduleNextPlayersUpdate(sockets, sessions);
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


async function updatePlayers(sockets, sessions): Promise<void> {
  const allSessions = sessions
    .getSessions();

  debug(`Sessions: ${allSessions.length}`);
  await Bluebird.map(allSessions, refreshSession, { concurrency: 10 });

  const sessionsPlaying = sessions
    .getSessions()
    .filter(session => session.username === session.room);

  debug(`Sessions playing: ${sessionsPlaying.length}`);
  await Bluebird.map(sessionsPlaying, async function(session) {
    await updatePlayersAndListeners(sockets, sessions, session);
  }, { concurrency: 10 });
}


async function refreshSession(session): Promise<void> {
  const { username, product } = session;
  const user                  = await updateUser(username);
  const canPlay               = !!(user && user.currentlyPlaying && user.currentlyPlaying.device);
  debug({ username, canPlay, product });
  const statusChanged = session.canPlay !== canPlay;

  session.canPlay           = canPlay;
  session.previouslyPlaying = session.isListening ? session.currentlyPlaying : null;
  session.currentlyPlaying  = user.currentlyPlaying;
  session.isListening       = canPlay && session.isListening;

  if (statusChanged)
    emitSessionUpdated(session);
}


async function updatePlayersAndListeners(sockets, sessions, session): Promise<void> {
  const { username } = session;
  const { room }     = session;
  const player       = getPlayerState(session);
  emitPlayerUpdated(sockets, room, player);

  const sessionsListening = getListeningSessions(sessions, room);

  debug(`Sessions listening to ${username}: ${sessionsListening.length}`);
  await synchronizeListeners(sockets, sessionsListening, session);
}


async function synchronizeListeners(sockets, sessionsListening, sessionPlaying): Promise<void> {
  const { currentlyPlaying } = sessionPlaying;
  await Bluebird.map(sessionsListening, async function(session) {
    const { username } = session;
    const user         = await findUser(username);
    debug({ username, pre: session.previouslyPlaying, now: session.currentlyPlaying });

    if (session.isListening && session.canPlay) {
      const wasListening     = session.previouslyPlaying && session.previouslyPlaying.isPlaying;
      const changedSong      = wasListening && session.previouslyPlaying.item.uri !== session.currentlyPlaying.item.uri;
      const pausedPlayer     = session.previouslyPlaying && session.previouslyPlaying.isPlaying && !session.currentlyPlaying.isPlaying;
      const shouldDisconnect = changedSong || pausedPlayer;

      debug({ username, wasListening, changedSong, pausedPlayer, shouldDisconnect });
      if (shouldDisconnect) {
        const reason = getDisconnectReason({ changedSong, pausedPlayer });
        emitSessionError(session, { name: 'UserDisconnected', message: 'User disconnected', reason });
        disconnectPlayer(session);
        return;
      }

      try {
        const isPlayingSameSong = session.currentlyPlaying.item.uri === currentlyPlaying.item.uri;
        const isTooApart        = Math.abs(session.currentlyPlaying.progressMS - currentlyPlaying.progressMS) > ms('4s');
        const shouldPlay        = currentlyPlaying.isPlaying && (!isPlayingSameSong || isTooApart);
        const shouldPause       = !currentlyPlaying.isPlaying && session.currentlyPlaying.isPlaying;

        debug({ username, isPlayingSameSong, isTooApart, shouldPlay, shouldPause });

        if (shouldPlay)
          await spotify.play(user, currentlyPlaying.item.uri, currentlyPlaying.progressMS);
        else if (shouldPause)
          await spotify.pause(user);

      } catch (error) {
        if (error instanceof spotify.PlayerNotRespondingError) {
          user.set({ 'currentlyPlaying.lastErrorStatus': 404 });
          await user.save();
          emitSessionError(session, { name: 'PlayerNotResponding', message: 'Your player is not responding. ' });
          disconnectPlayer(session);
        }
      }
    }
  });
}

function getDisconnectReason({ changedSong, pausedPlayer }): string {
  if (changedSong)
    return 'You switched songs';
  else if (pausedPlayer)
    return 'You paused your player';
  else
    return 'unknown reason :-(';
}

function getPlayerState(session: Session): PlayerStateResponse {
  return {
    session: {
      name:     session.name,
      username: session.username
    },
    player: getPlayer(session.currentlyPlaying)
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
