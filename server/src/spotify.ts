import * as auth                                         from './auth';
import { UserModel }                                     from './models/user';
import axios, { AxiosRequestConfig }                     from 'axios';
import qs                                                from 'qs';


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


export async function getAccessToken({ refreshToken }: GetAccessTokenParams): Promise<RefreshAccessTokenResponse> {
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

  /* eslint-disable @typescript-eslint/camelcase  */
  const data = qs.stringify({
    grant_type:    'refresh_token',
    refresh_token: refreshToken
  });
  /* eslint-enable @typescript-eslint/camelcase  */

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    data,
    options
  );

  return {
    accessToken: response.data.access_token,
    expiresIn:   response.data.expires_in
  };
}

export async function getCurrentPlayer({ accessToken }: GetCurrentPlayerParams): Promise<CurrentPlayerResponse> {
  const options: AxiosRequestConfig = {
    headers: {
      'Accept':        'application/json',
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${  accessToken}`
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
  const { accessToken } = user;

  await retryIf;
  async function doPlay() {
    const options: AxiosRequestConfig = {
      headers: {
        'Accept':        'application/json',
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    /* eslint-disable @typescript-eslint/camelcase  */
    const data = {
      uris:        [ itemURI ],
      position_ms: progressMS
    };
    /* eslint-enable @typescript-eslint/camelcase  */

    await axios.put('https://api.spotify.com/v1/me/player/play', data, options);
  }

}

export async function pause(user: UserModel): Promise<void> {
  const { accessToken } = user;

  const options: AxiosRequestConfig = {
    headers: {
      'Accept':        'application/json',
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  };

  try {
    const response = await axios.put('https://api.spotify.com/v1/me/player/pause', options);
    console.log({ response });
  } catch (error) {
    console.log({ error });
  }

}
