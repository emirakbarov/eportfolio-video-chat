const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    allowEIO3: true
});
const { v4: uuidV4 } = require('uuid');
const bp = require('body-parser');
const port = 3000;
const roomSockets = {};

app.set('view-engine', 'ejs');
app.use(express.static('public'));
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

const users = {};

app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.get('/new-room', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});
app.get('/room', (req, res) => {
    res.render('room.ejs', {roomId: "/"});
});

app.get('/manual-create', (req, res) => {
    res.redirect(`/${code()}`);
});

app.get('/:room', (req, res) => {
    res.render('room.ejs', {roomId: req.params.room});
});
app.get('/:code', (req, res) => {
    res.render('room.ejs', {code: req.params.code});
});

io.on('connection', socket => {
    console.log('user connected');

    socket.on('request-connection', (roomId, userId) => {
        const roomSocketsCount = roomSockets[roomId] || 0;
        if (roomSocketsCount >= 2) {
            socket.emit('room-full'); // Inform the client that the room is full
            return;
        }

        socket.join(roomId);
        socket.broadcast.to(roomId).emit('create-connection', userId);
        socket.on('new-user', name => {
            users[socket.id] = name;
            socket.broadcast.to(roomId).emit('broadcast-user-join', name);
            socket.to(roomId).emit('get-users', users);
        });
        socket.on('send-message', message => {
            socket.broadcast.to(roomId).emit('broadcast-message', message, users[socket.id]);
        });
        socket.on('disconnect', () => {
            console.log(`${users[socket.id]} disconnected`);
            const temp = users[socket.id];
            delete users[socket.id];
            socket.broadcast.to(roomId).emit('user-disconnected', temp, users, userId);

            roomSockets[roomId] = Math.max(0, (roomSockets[roomId] || 0) - 1);
        });

        roomSockets[roomId] = (roomSockets[roomId] || 0) + 1;
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

function code() {
    return Math.floor(100000 + Math.random() * 900000);
}