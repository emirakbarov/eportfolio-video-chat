const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const port = 3000;

app.set('view-engine', 'ejs');
app.use(express.static('public'));

const users = {};

app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.get('/room', (req, res) => {
    res.render('room.ejs');
})

io.on('connection', socket => {
    console.log('user connected');
    socket.on('new-user', name => {
        users[socket.id] = name;
        socket.broadcast.emit('broadcast-user-join', name);
        socket.emit('get-users', users);
    });
    socket.on('send-message', message => {
        socket.broadcast.emit('broadcast-message', message, users[socket.id]);
    });
    socket.on('disconnect', () => {
        console.log(`${users[socket.id]} disconnected`);
        const temp = users[socket.id];
        delete users[socket.id];
        socket.broadcast.emit('user-disconnected', temp, users);
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});