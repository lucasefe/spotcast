import * as auth                                                     from './auth';
import { UserModel }                                                 from './models/user';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse }   from 'axios';
import Debug                                                         from 'debug';
import qs                                                            from 'qs';
import('axios-debug-log');

const debug = Debug('spotify');

export class PlayerNotRespondingError extends Error {

}

/* eslint-disable @typescript-eslint/camelcase  */

export interface Album {
  id: string;
  name: string;
  type: string;
  uri: string;
  href: string;
  images: Array<Image>;
}

export interface Image {
  url: string;
  width: number;
  height: number;
}

export interface Artist{
  id: string;
  name: string;
  type: string;
  uri: string;
  href: string;
}

export interface Item {
  id: string;
  type: string;
  uri: string;
  name: string;

  album: Album;
  artists: Array<Artist>;
  disc_number: number;
  duration_ms: number;
  explicit: false;
  external_ids: [Record<string, any>];
  external_urls: [Record<string, any>];
  href: string;
  is_local: boolean;
  popularity: number;
  preview_url: string;
  track_number: number;
}

export interface PlayingState {
  device: Record<string, any>;
  shuffleState: boolean;
  repeatState: string;
  timestamp: number;
  context: Record<string, any>;
  progressMS: number;
  item: Item;
  currentlyPlayingType: string;
  isPlaying: boolean;
}

interface RefreshAccessTokenResponse {
  accessToken: string;
  expiresIn: number;
}


export interface PlayingStateResponse {
  device: Record<string, any>;
  shuffleState: boolean;
  repeatState: string;
  timestamp: number;
  context: Record<string, any>;
  progressMS: number;
  item: Record<string, any>;
  currentlyPlayingType: string;
  isPlaying: boolean;
}

export async function getAccessToken(user): Promise<RefreshAccessTokenResponse> {
  debug(`Getting access token for user ${user.username}`);
  const { refreshToken } = user;

  const options: AxiosRequestConfig = {
    headers: {
      'Accept':       'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: {
      username: auth.clientID,
      password: auth.clientSecret
    }
  };

  const data = qs.stringify({
    grant_type:    'refresh_token',
    refresh_token: refreshToken
  });

  const response = await axios.post('https://accounts.spotify.com/api/token', data, options);

  return {
    accessToken: response.data.access_token,
    expiresIn:   response.data.expires_in
  };
}

export async function getPlayingState(user: UserModel): Promise<AxiosResponse> {
  const { accessToken } = user;

  const options: AxiosRequestConfig = {
    headers: {
      'Accept':        'application/json',
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${accessToken}`
    }
  };

  const instance = getSpotifyAPIClient(user);
  const response = await instance.get('/me/player', options);
  return response;
}


export async function play(user: UserModel, itemURI, progressMS): Promise<void> {
  debug(`Playing  ${user.username}:${itemURI}:${progressMS}`);

  const instance = getSpotifyAPIClient(user);
  try {
    await instance.put('/me/player/play', {
      uris:        [ itemURI ],
      position_ms: progressMS
    });
  } catch (error) {
    if (error.response && error.response.status === 404)
      throw new PlayerNotRespondingError();
    else
      throw error;
  }
}

export async function pause(user: UserModel): Promise<void> {
  debug(`Pausing  ${user.username}`);
  const instance = getSpotifyAPIClient(user);
  try {
    await instance.put('/me/player/pause');
  } catch (error) {
    if (error.response && error.response.status === 404)
      throw new PlayerNotRespondingError();
    else
      throw error;
  }
}

function getSpotifyAPIClient(user: UserModel): AxiosInstance {
  const { accessToken } = user;
  const instance        = axios.create({
    baseURL: 'https://api.spotify.com/v1',
    timeout: 5000,
    headers: {
      'Accept':        'application/json',
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });

  instance.interceptors.response.use(response => {
    return response;
  },
  function(error) {
    if (error.response.error)
      debug(error.response.error);
    else
      debug(error);

    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      return refreshAccessToken(user)
        .then(newAccessToken => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        });
    } else
      return Promise.reject(error);
  });

  return instance;
}

async function refreshAccessToken(user: UserModel): Promise<string> {
  const { accessToken: newAccessToken, expiresIn } = await getAccessToken(user);

  debug(`Saving access token for user ${user.username}`);
  user.set({ accessToken: newAccessToken, expiresIn });
  await user.save();
  return newAccessToken;
}
