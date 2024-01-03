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
let activeRooms = [];
let roomUrl;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

connectDB(); // connect the database'

app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.get('/new-room', async (req, res) => {
    console.log(roomUrl);
    res.redirect(`/${uuidV4()}`);
    //getActiveRooms().then(activeRooms => {
    //    if (activeRooms) {
    //        let selectedRoom = activeRooms[Math.floor(Math.random() * activeRooms.length)];
    //        if (selectedRoom.roomId == roomUrl) {
    ///            if (activeRooms.length == 1) {
    //                res.redirect(`/${uuidV4()}`);
    //            } else {
    //                selectedRoom = activeRooms[Math.floor(Math.random() * activeRooms.length)];
    //                res.redirect(`/${selectedRoom.roomId}?final=true`);
    //            }
    //        } else {
    //            res.redirect(`/${selectedRoom.roomId}?final=true`); // go to available room
   //         }
    //    } else {
    //        console.log('no active rooms')
    //        res.redirect(`/${uuidV4()}`); // redirect to a new room
    //    }
    //});

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
    roomUrl = req.params.room;

    if (joinCode) {
        const room = new JoinableRoom({code: joinCode, roomId: roomUrl});
        await room.save();
        res.redirect(`/${roomUrl}`);
    } else if (enteredCode) {
        const lookForRoom = await JoinableRoom.findOne({code: enteredCode});
        if (lookForRoom) {
            const roomId = lookForRoom.roomId;
            res.redirect(`/${roomId}`);
        } else {
            const referer = req.headers.referer || '/';
            res.redirect(`${referer}`);
        }
    } else {
        const existingRoom = await ActiveRoom.findOne({ roomId: roomUrl, full: true });
        if (existingRoom) {
            res.redirect('/room');
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
                    res.render('room.ejs', { roomId: roomUrl });
                } 
            } else {
                res.render('room.ejs', { roomId: roomUrl });
            }
        }
    }
});

io.on('connection', socket => {
    socket.on('request-connection', async (roomId, userId, name) => {
        let room = await io.of('/').allSockets();
        let other = await io.of('/').in(roomId).allSockets();
        console.log(room, other);
        
        socket.join(roomId);
        
        socket.broadcast.to(roomId).emit('create-connection', userId, name); // to other user

        socket.on('new-user', () => {
            console.log('join: ' + room);
            updateFullProperty(roomId, true);
            console.log('full property updated to true');
        });
        
        socket.on('send-message', message => {
            socket.broadcast.to(roomId).emit('broadcast-message', message, name);
        });

        socket.on('disconnect', async () => {
            console.log('after disconnection: 1 ' + room);
            room--;
            if (room == 0) {
                await ActiveRoom.deleteOne({roomId: roomUrl});
                console.log('room deleted');
            }
            else if (room == 1) {
                socket.broadcast.to(roomId).emit('user-disconnected', name, userId);
                updateFullProperty(roomId, false);
                console.log('full property updated to false');
            }
            console.log('after disconnection: 2 ' + room);
        });
    });
});

async function updateFullProperty(roomId, boolean) {
    try {
        const filter = {roomId: roomId};
        const update = { full: boolean };
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