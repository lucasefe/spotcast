import * as auth                                                    from './auth';
import { UserModel }                                                from './models/user';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse }  from 'axios';
import Debug                                                        from 'debug';
import qs                                                           from 'qs';
import('axios-debug-log');

const debug = Debug('spotify');

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

export interface CurrentPlayer {
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

interface GetAccessTokenParams {
  refreshToken: string;
}

interface RefreshAccessTokenResponse {
  accessToken: string;
  expiresIn: number;
}

interface GetCurrentPlayerParams {
  accessToken: string;
}

export interface CurrentPlayerResponse {
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
  const response = await requestAccessToken(user);
  return {
    accessToken: response.data.access_token,
    expiresIn:   response.data.expires_in
  };
}

export async function getCurrentPlayer(user: UserModel): Promise<CurrentPlayerResponse> {
  const { accessToken } = user;

  const options: AxiosRequestConfig = {
    headers: {
      'Accept':        'application/json',
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${accessToken}`
    }
  };

  const response = await axios.get('https://api.spotify.com/v1/me/player', options);

  return {
    device:               response.data.device,
    shuffleState:         response.data.shuffle_state,
    repeatState:          response.data.repeat_state,
    timestamp:            response.data.timestamp,
    context:              response.data.context,
    progressMS:           response.data.progress_ms,
    item:                 response.data.item,
    currentlyPlayingType: response.data.currently_playing_type,
    isPlaying:            response.data.is_playing
  };
}


export async function play(user: UserModel, itemURI, progressMS): Promise<void> {
  debug(`Playing  ${user.username}:${itemURI}:${progressMS}`);

  const instance = getSpotifyAPIClient(user);
  await instance.put('/me/player/play', {
    uris:        [ itemURI ],
    position_ms: progressMS
  });
}

export async function pause(user: UserModel): Promise<void> {
  debug(`Pausing  ${user.username}`);
  const instance = getSpotifyAPIClient(user);
  await instance.put('/me/player/pause');
}


function requestAccessToken(user): Promise<AxiosResponse> {
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

  return axios.post('https://accounts.spotify.com/api/token', data, options);
}


function getSpotifyAPIClient(user: UserModel): AxiosInstance {
  const { accessToken } = user;
  const instance        = axios.create({
    baseURL: 'https://api.spotify.com/v1',
    timeout: 1000,
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
    debug(error.response.data.error);
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {

      originalRequest._retry = true;

      return requestAccessToken(user)
        .then(res => {
          const newAccessToken = res.data.access_token;
          // TODO Store token
          // const expiresIn      = res.data.expires_in;
          if (res.status === 200) {
            originalRequest.headers.common.Authorization = `Bearer ${  newAccessToken}`;
            return axios(originalRequest);
          } else
            return res;
        });
    } else if (error.response.status === 404)
      return Promise.reject('NoDevice');
    else
      return Promise.reject(error);
  });

  return instance;
}
