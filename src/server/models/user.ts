import mongoose, { Document, Schema } from 'mongoose';

interface User extends Document {
  name?: string;
  username: string;
  photoURL?: string;

  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  accessTokenRefreshedAt: Date;
}

const UserSchema = new Schema({
  name:         { type: String },
  username:     { type: String, required: true },
  photoURL:     { type: String },

  accessToken:            { type: String, required: true },
  refreshToken:           { type: String, required: true },
  expiresIn:              { type: Number, required: true },
  accessTokenRefreshedAt: { type: Date }

}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model<User>('User', UserSchema);
