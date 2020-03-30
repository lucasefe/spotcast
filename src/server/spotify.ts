import * as auth                                         from './auth';
import axios, { AxiosRequestConfig }                     from 'axios';
import qs                                                from 'qs';


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
