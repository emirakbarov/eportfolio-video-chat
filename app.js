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
const users = {};
const rooms = {};
const codes = [];

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

connectDB();

const roomSchema = new mongoose.Schema({
    code: String,
    roomId: String,
});
const joinableRoom = mongoose.model('joinableRoom', roomSchema);

app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.get('/new-room', (req, res) => {
    const joinCode = "null";
    res.redirect(`/${uuidV4()}?joinCode=${joinCode}`);
});

app.get('/manual-create', (req, res) => {
    const joinCode = code();
    res.redirect(`/${uuidV4()}?joinCode=${joinCode}`);
});

app.post('/manual-join', (req, res) => {
    const enteredCode = req.body.code;
    console.log(enteredCode, rooms[enteredCode]);
    if (rooms[enteredCode]) {
        res.redirect(`/${uuidV4()}?enteredCode=${enteredCode}`);
    } else {
        // Handle the case where the entered code is not valid
        res.render('index.ejs', { errorMessage: 'Invalid code' });
    }
});

app.get('/:room', (req, res) => {
    const joinCode = req.query.joinCode;
    const enteredCode = req.query.enteredCode;

    if (joinCode) {
        rooms[joinCode] = req.params.room;
        res.render('room.ejs', { roomId: req.params.room });
    } else if (enteredCode) {
        if (rooms[enteredCode]) {
            res.render(`/${rooms[enteredCode]}`);
        } else {
            const referer = req.headers.referer || '/';
            res.redirect(`${referer}`, { err: '404' });
        }
    } else {
        res.render('room.ejs', { roomId: req.params.room });
    }
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
    let code;
    do {
        code = Math.floor(100000 + Math.random() * 900000);
    } while (codes[code])
    codes.push(code);
    return code;
}