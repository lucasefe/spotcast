import * as auth                                         from './auth';
import axios, { AxiosRequestConfig }                     from 'axios';
import qs                                                from 'qs';

interface RefreshAccessTokenResponse {
  accessToken: string;
  expiresIn: number;
}

interface GetAccessTokenResponse {
  refreshToken: string;
}

export async function getAccessToken({ refreshToken }: GetAccessTokenResponse): Promise<RefreshAccessTokenResponse> {
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
