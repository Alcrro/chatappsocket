class Room {
  constructor() {
    this.roomName = "mainRoom";
    this.onlineUsers = this.currentUsers();
  }

  currentUsers(io) {
    return 12;
  }
}

module.exports = Room;
