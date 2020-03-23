import { Event } from './event';
import { User } from '../models/user';

export class UserConnectedEvent {
    static readonly eventName: string = Event.UserConnected;
    public userId: string;

    constructor(user: User) {
      this.userId = user.userId;
    }
}
