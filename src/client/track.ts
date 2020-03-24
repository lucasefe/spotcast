export default class Track {

  public id: string;
  public userID: string;
  public addedAt: Date;

  constructor(trackID: string, userID: string, addedAt: Date) {
    this.id = trackID;
    this.userID = userID;
    this.addedAt = addedAt;
  }
}
