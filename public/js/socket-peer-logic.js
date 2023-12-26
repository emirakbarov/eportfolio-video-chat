// define vars
const socket = io();
var peer = new Peer();
const peers = {};

// define static vars 
let name;
const videoContainer = document.getElementById('video-container');
const userVideoContainer = document.getElementById('video1');
const partnerVideoContainer = document.getElementById('video2');

//get name
do {
    name = prompt('What is your name?');
} while (name == null);

//create user video
const userVideo = document.createElement('video');
userVideo.classList.add('videos');
userVideoContainer.append(userVideo);
userVideo.muted = true;

//handle the openning
peer.on('open', id => {
    console.log('unique-id is ', id);
    socket.emit('request-connection', id);
});

//add audio to video
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(userVideo, stream); // add the video stream to the video component

    socket.on('create-connection', userId => {
        connectToNewUser(userId, stream);
    }); 
    // handle calling response
    peer.on('call', call => {
        console.log('called');
        call.answer(stream);
        const partnerVideo = document.createElement('video');
        partnerVideo.classList.add('videos');
        partnerVideoContainer.append(partnerVideo);
        call.on('stream', partnerVideoStream => {
            addVideoStream(partnerVideo, partnerVideoStream);
        });
    });
});

function connectToNewUser(userId, stream) {
    const call = peer.call(userId, stream); // call the user with the given Id
    const video = document.createElement("video");
    call.on('stream', (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
        video.remove();
    });
};

appendMessage(`You (${name}) joined`, center);
socket.emit('new-user', name);
socket.on('get-users', users => {
    appendMessage(checkForUsers(users), center);
});

socket.on('user-disconnected', (user, users) => {
    appendMessage(`${user} disconnected!`, center);
    appendMessage(checkForUsers(users, user), center);
});

socket.on('broadcast-user-join', name => {
    appendMessage(`${name} joined`, center);
});

socket.on('broadcast-message', (message, name) => {
    appendMessage(`${name}: ${message}`, left);
});

messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = document.getElementById('message');
    if (message.value != '') {
        socket.emit('send-message', message.value);
        appendMessage(`You: ${message.value}`, right);
        message.value = '';
    } else {
        alert('Please enter a message!');
    }
});

function checkForUsers(users) {
    if (Object.keys(users).length < 2) {
        return 'No users in the chat apart from you!';
    } else {
        let otherUsers = [];
        for (let username in users) {
            if (users[username] != name) {
                otherUsers.push(users[username]);
            }
        }
        return `Other users in the chat: ${otherUsers.toString()}`;
    }
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
}
function appendMessage(message, pos) {
    const appendedMessage = document.createElement('div');
    appendedMessage.classList.add("div");
    appendedMessage.classList.add(pos);
    appendedMessage.innerText = message;
    messageContainer.append(appendedMessage);
    messageContainer.scrollTop = messageContainer.scrollHeight
}