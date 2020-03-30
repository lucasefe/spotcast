import { CurrentPlayer }              from '../spotify';
import mongoose, { Document, Schema } from 'mongoose';


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
    repeatState:          { type: String, enum: [ 'off' ] },
    timestamp:            { type: Number },
    context:              { type: Object },
    progressMS:           { type: Number },
    item:                 { type: Object },
    currentlyPlayingType: { type: String, enum: [ 'track', 'album', 'artist' ] },
    isPlaying:            { type: Boolean }
  }

}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model<UserModel>('User', UserSchema);
