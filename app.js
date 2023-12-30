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
const mongoose = require('mongoose');
const PORT = 3000;
const roomSockets = {};
const users = {};

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

connectDB();

const roomSchema = new mongoose.Schema({
    code: Number,
    roomId: String,
});
const JoinableRoom = mongoose.model('JoinableRoom', roomSchema);

app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.get('/room', (req, res) => {
    res.render('room.ejs', {roomId: "/"});
});
app.get('/new-room', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

app.get('/manual-create', async (req, res) => {
    const joinCode = await code();
    res.redirect(`/${uuidV4()}?joinCode=${joinCode}`);
});

app.post('/manual-join', (req, res) => {
    const enteredCode = req.body.code;
    res.redirect(`/${uuidV4()}?enteredCode=${enteredCode}`);
});

app.get('/:room', async (req, res) => {
    const joinCode = parseInt(req.query.joinCode);
    const enteredCode = parseInt(req.query.enteredCode);

    if (joinCode) {
        const roomUrl = req.params.room;
        const room = new JoinableRoom({joinCode, roomUrl});
        await room.save();
        console.log(room);
        res.render('room.ejs', { roomId: roomUrl });
    } else if (enteredCode) {
        const lookForRoom = await JoinableRoom.findOne({'code': enteredCode});
        console.log(lookForRoom);
        if (lookForRoom) {
            const roomId = lookForRoom.roomId;
            res.render(`/${roomId}`);
        } else {
            const referer = req.headers.referer || '/';
            res.redirect(`${referer}`);
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


mongoose.connection.once('open', () => {
    console.log("database connected");
    app.listen(PORT, () => {
        console.log('server running on port', PORT);
    });
});

async function connectDB() {
    try {
        await mongoose.connect('mongodb+srv://akbarovemir3:uh7MS2hNk2ozb1BM@chatapp-data.elw2r2p.mongodb.net/?retryWrites=true&w=majority', {
            useUnifiedTopology:true,
            useNewUrlParser:true
        });
    } catch(err) {
        console.log(err);
    }
}

async function code() {
    let code;
    const allCodes = await JoinableRoom.find({}, 'code');
    
    do {
        code = Math.floor(100000 + Math.random() * 900000);
    } while (allCodes.includes(code));

    return code;
}