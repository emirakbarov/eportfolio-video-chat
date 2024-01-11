// define vars
const socket = io();
var peer = new Peer();
const peers = {};

// define static vars 
let name;
const videoContainer = document.getElementById('video-container');
const userVideoContainer = document.getElementById('video1');
const partnerVideoContainer = document.getElementById('video2');
let isMuted = false;
let videoStoped = false;
let socketDisconnected;

//get name
do {
    name = prompt('What is your name?');
} while (name == null);

//check if room full

console.log('here');

socket.on('room-full', () => {
    alert('Room is full, try another room');
    window.location.href = window.location.origin + '/room';
});

//create user video

const userVideo = document.createElement('video');
userVideo.classList.add('videos');
userVideoContainer.append(userVideo);
userVideo.muted = true;

//add audio to video
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(userVideo, stream); // add the video stream to the video component

    appendMessage(`You (${name}) joined`, center);

    socket.on('create-connection', (userId, name) => { // as other user
        connectToNewUser(userId, stream);
        appendMessage(`${name} joined`, center);
        socket.emit('new-user');
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
    console.log('new user broadcasted');

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
    socket.on('user-disconnected', (user, userId) => {
        peers[userId].close();
        appendMessage(`${user} disconnected!`, center);
        socketDisconnected = true;
        socket.emit('update-room-size');
    });
});

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    })
}
function appendMessage(message, pos) {
    const appendedMessage = document.createElement('div');
    appendedMessage.classList.add("div");
    appendedMessage.classList.add(pos);
    appendedMessage.innerText = message;
    messageContainer.append(appendedMessage);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

const muteSelf = document.getElementById('mute-self');
const stopVideo = document.getElementById('stop-video-self');

peer.on('open', id => {
    if(ROOM_ID != '/') {
        socket.emit('request-connection', ROOM_ID, id, name);
        console.log(id);
    } else {
        console.log('roomid slash');
    }
});

window.addEventListener('unload', () => {
    console.log(socketDisconnected);
    if (socketDisconnected == false) {
        socket.disconnect();
    }
});

muteSelf.addEventListener('click', () => {
    if (userVideo) {
        isMuted = !isMuted;

        userVideo.srcObject.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });

        if (isMuted) {
            console.log('You are muted');
        } else {
            console.log('You are unmuted');
        }
    } else {
        alert('No video/microphone detected. Mute failed');
    }
});
stopVideo.addEventListener('click', () => {
    if(userVideo) {
        videoStoped = !videoStoped;

        userVideo.srcObject.getVideoTracks().forEach(track => {
            track.enabled = !videoStoped;
        });
    }
});

function connectToNewUser(userId, stream) {
    const call = peer.call(userId, stream); // call the user with the given Id
    const video = document.createElement("video");
    video.classList.add('videos');
    partnerVideoContainer.append(video);
    call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
        video.remove();
        if (socketDisconnected == false) {
            socket.disconnect();
        }
    });
    peers[userId] = call;
};