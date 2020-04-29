import * as spotify                        from '../spotify';
import { CurrentPlayer }                   from '../spotify';
import mongoose, { Document, Schema }      from 'mongoose';


export interface UserModel extends Document {
  name?: string;
  username: string;
  photoURL?: string;

  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  accessTokenRefreshedAt: Date;

  currentPlayer?: CurrentPlayer;
}


const UserSchema = new Schema({
  name:         { type: String },
  username:     { type: String, required: true },
  photoURL:     { type: String },

  accessToken:            { type: String, required: true },
  refreshToken:           { type: String, required: true },
  expiresIn:              { type: Number, required: true },
  accessTokenRefreshedAt: { type: Date },

  currentPlayer: {
    device:               { type: Object },
    shuffleState:         { type: Boolean },
    repeatState:          {
      type: String,
      enum: [ 'off', 'track', 'context' ]
    },
    timestamp:            { type: Number },
    context:              { type: Object },
    progressMS:           { type: Number },
    item:                 { type: Object },
    currentlyPlayingType: { type: String, enum: [ 'track', 'album', 'artist' ] },
    isPlaying:            { type: Boolean }
  }

}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const User = mongoose.model<UserModel>('User', UserSchema);

export default User;

export async function updateUser(username): Promise<UserModel> {
  const user          = await findUser(username);
  const currentPlayer = await getCurrentPlayer(user);
  user.set({ currentPlayer });
  await user.save();
  return user;
}


export async function findUser(username): Promise<UserModel> {
  const user = await User.findOne({ username });
  if (user)
    return user;
  else
    throw new Error(`User not found: ${username}`);
}


export async function getCurrentPlayer(user): Promise<spotify.CurrentPlayerResponse| null> {
  try {
    const currentPlayer = await spotify.getCurrentPlayer(user);
    return currentPlayer;
  } catch (error) {
    const isUnauthorized = error.response && error.response.status === 401;
    if (isUnauthorized) {
      const { accessToken } = await spotify.getAccessToken(user);
      const currentPlayer   = await spotify.getCurrentPlayer(user);
      user.set({ currentPlayer, accessToken, accessTokenRefreshedAt: Date.now() });
      await user.save();
      return currentPlayer;
    } else
      throw error;
  }

}
