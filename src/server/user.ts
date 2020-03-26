import mongoose, { Document, Schema } from 'mongoose';

interface User extends Document {
  name?: string;
  username: string;
  photoURL?: string;

  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const UserSchema = new Schema({
  name:         { type: String },
  username:     { type: String, required: true },
  photoURL:     { type: String },

  accessToken:  { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresIn:    { type: Number, required: true }
});

export default mongoose.model<User>('User', UserSchema);
