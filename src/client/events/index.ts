import { Event } from './event';

export class UserConnectedEvent {
    static readonly eventName: string = Event.UserConnected;
}

export class ConnectedEvent {
    static readonly eventName: string = Event.Connected;
}
