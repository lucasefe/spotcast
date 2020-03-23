import * as uuid from "uuid"

export class User {
  public userId: string;
  constructor() {
    this.userId = uuid.v4();
  }
}
