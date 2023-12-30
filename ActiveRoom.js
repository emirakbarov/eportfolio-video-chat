const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activeRoomSchema = new Schema({
    roomId: String,
    full: Boolean
});

const ActiveRoom = mongoose.model('activeroom', activeRoomSchema);

module.exports = ActiveRoom;