const room_id = "<%= roomId %>";

const socket = io('/');

socket.emit('join-room', room_id, 10);