import * as spotify                        from '../spotify';
import { CurrentPlayer }                   from '../spotify';
import mongoose, { Document, Schema }      from 'mongoose';


export interface UserModel extends Document {
  name?: string;
  username: string;
  photoURL?: string;
  provider: string;
  product: string;

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
  provider:     { type: String },
  product:     { type: String },

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
    currentlyPlayingType: { type: String, enum: [ 'track', 'episode', 'ad', 'unknown' ] },
    isPlaying:            { type: Boolean }
  },
  profile: { type: Object }

}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const User = mongoose.model<UserModel>('User', UserSchema);

export default User;

export async function updateUser(username): Promise<UserModel> {
  const user = await findUser(username);
  try {
    const response      = await spotify.getCurrentPlayer(user);
    const currentPlayer = parseCurrentPlayer(response.data);
    console.log({ currentPlayer });
    user.set({ currentPlayer });
    await user.save();
    return user;
  } catch (error) {
    const playerCannotBeFound = error.response && (error.response.status === 404 || error.response.status === 204);
    if (playerCannotBeFound) {
      user.set({ currentPlayer: null });
      await user.save();
      return user;
    } else
      throw error;
  }
}


export async function findUser(username): Promise<UserModel> {
  const user = await User.findOne({ username });
  if (user)
    return user;
  else
    throw new Error(`User not found: ${username}`);
}


function parseCurrentPlayer(data): spotify.CurrentPlayerResponse | null {
  if (data) {
    return {
      device:               data.device,
      shuffleState:         data.shuffle_state,
      repeatState:          data.repeat_state,
      timestamp:            data.timestamp,
      context:              data.context,
      progressMS:           data.progress_ms,
      item:                 data.item,
      currentlyPlayingType: data.currently_playing_type,
      isPlaying:            data.is_playing
    };
  } else
    return null;
}
