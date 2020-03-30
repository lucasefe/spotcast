import mongoose, { Document, Schema } from 'mongoose';

export interface Album {
  id: string;
  name: string;
  type: string;
  uri: string;
  href: string;
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

  album: Album;
  artists: [Array<Artist>];
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
