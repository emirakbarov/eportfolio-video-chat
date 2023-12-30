const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');
const bp = require('body-parser');
const mongoose = require('mongoose');
const JoinableRoom = require('./Room.js');
const ActiveRoom = require('./ActiveRoom.js');
const PORT = 3000;
const roomSockets = {};
const users = {};
let activeRooms = [];
let roomSocketsCount = 0;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

connectDB(); // connect the database'

app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.get('/new-room', (req, res) => {
    getActiveRooms().then(activeRooms => {
        if (activeRooms) {
            const selectedRoom = activeRooms[Math.floor(Math.random() * activeRooms.length)];
            res.redirect(`/${selectedRoom.roomId}?final=true`); // go to available room
        } else {
            console.log('no active rooms')
            res.redirect(`/${uuidV4()}`); // redirect to a new room
        }
    });
});
app.get('/room', (req, res) => {
    res.render('room.ejs', {roomId: "/"});
});
app.get('/manual-create', async (req, res) => {
    const joinCode = await code();
    console.log(joinCode);
    res.redirect(`/${uuidV4()}?joinCode=${joinCode}`);
});

app.post('/manual-join', (req, res) => {
    const enteredCode = req.body.code;
    res.redirect(`/${uuidV4()}?enteredCode=${enteredCode}`);
});

app.get('/:room', async (req, res) => {
    const joinCode = req.query.joinCode;
    const enteredCode = req.query.enteredCode;
    const roomUrl = req.params.room;

    if (joinCode) {
        const room = new JoinableRoom({code: joinCode, roomId: roomUrl});
        await room.save();
        console.log(room);
        res.redirect(`/${roomUrl}`);
    } else if (enteredCode) {
        const lookForRoom = await JoinableRoom.findOne({'code': enteredCode});
        console.log(lookForRoom);
        if (lookForRoom) {
            const roomId = lookForRoom.roomId;
            res.redirect(`/${roomId}`);
        } else {
            const referer = req.headers.referer || '/';
            res.redirect(`${referer}`);
        }
    } else {
        if (req.query.final != 'true') {
            if (roomUrl !== 'favicon.ico' &&
                roomUrl !== 'robots.txt' &&
                roomUrl !== 'sitemap.xml' &&
                roomUrl !== 'crossdomain.xml' &&
                roomUrl !== 'humans.txt' &&
                roomUrl !== 'ads.txt' &&
                !roomUrl.startsWith('.well-known/') &&
                roomUrl !== 'manifest.json' &&
                roomUrl !== 'favicon.png' &&
                roomUrl !== 'apple-touch-icon.png' &&
                roomUrl !== 'browserconfig.xml') {

                const newRoom = new ActiveRoom({ roomId: roomUrl, full: false });
                await newRoom.save(); // save to db
            } 
        }
        res.render('room.ejs', { roomId: req.params.room });
    }
});

io.on('connection', socket => {
    socket.on('request-connection', (roomId, userId) => {
        console.log('this one', roomSocketsCount);
        if (roomSocketsCount >= 2) {
            console.log('that one', roomSocketsCount);
            socket.emit('room-full'); // Inform the client that the room is full
            updateFullProperty(roomId);
            return;
        }
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('create-connection', userId);
        socket.on('new-user', name => {
            roomSocketsCount++;
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

            roomSocketsCount--;
            console.log('after disonnection', roomSocketsCount)
        });
    });
});

async function updateFullProperty(roomId) {
    try {
        const filter = {roomId: roomId};
        const update = { full: true };
        const updatedRoom = await ActiveRoom.findOneAndUpdate(filter, update);
    } catch(err) {
        console.log(err);
    }
}

async function getActiveRooms() {
    try {
        activeRooms = await ActiveRoom.find({ full: false });
        const noActiveRooms = activeRooms.every(room => room.full == true);
        if (noActiveRooms) {
            return false;
        } else {
            return activeRooms;
        }
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

async function connectDB() {
    mongoose.connect('mongodb+srv://akbarovemir3:uh7MS2hNk2ozb1BM@chatapp-data.elw2r2p.mongodb.net/chatappdata?retryWrites=true&w=majority')
    .then(() => {
        console.log('db connected');
        server.listen(PORT, () => {
            console.log('Server running on port', PORT);
        })
    })
    .catch(err => console.log(err));
}