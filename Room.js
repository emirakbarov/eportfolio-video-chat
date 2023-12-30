const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    code: Number,
    roomId: String,
});

const JoinableRoom = mongoose.model('roomcode', roomSchema);

module.exports = JoinableRoom;