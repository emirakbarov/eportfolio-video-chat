// define vars
const socket = io();
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
    var peer = new Peer({
        host: 'localhost',
        port: 3000,
        path: '/peerjs',
        config: { 'iceServers': [
        { url: 'stun:stun01.sipphone.com' },
        { url: 'stun:stun.ekiga.net' },
    { url: 'stun:stunserver.org' },
    { url: 'stun:stun.softjoys.com' },
    { url: 'stun:stun.voiparound.com' },
    { url: 'stun:stun.voipbuster.com' },
    { url: 'stun:stun.voipstunt.com' },
    { url: 'stun:stun.voxgratia.org' },
    { url: 'stun:stun.xten.com' },
    {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
        }
      ]
       },
    
    debug: 3
    });
    addVideoStream(userVideo, stream); // add the video stream to the video component
    peer.on('open', otherId => {
        if(ROOM_ID != '/') {
            socket.emit('request-connection', ROOM_ID, otherId, name);
            console.log(otherId);
        } else {
            console.log('roomid slash');
        }
    });
    appendMessage(`You (${name}) joined`, center); // tell who joined

    socket.on('create-connection', (otherId, name) => { // as other user
        connectToNewUser(otherId, stream);
        appendMessage(`${name} joined`, center);
        socket.emit('new-user');
    }); 
    // handle calling response
    peer.on('call', call => {
        console.log('called');
        call.answer(stream); //send them the stream
        const partnerVideo = document.createElement('video');
        partnerVideo.classList.add('videos');
        partnerVideoContainer.append(partnerVideo);
        call.on('stream', partnerVideoStream => {
            addVideoStream(partnerVideo, partnerVideoStream);
            console.log(partnerVideoStream);
        });
    });
    peer.on('error', error => console.error(error))

    function connectToNewUser(otherId, stream) {
        const call = peer.call(otherId, stream); // call the user with the given Id
        const video = document.createElement("video");
        video.classList.add('videos');
        partnerVideoContainer.append(video);
        call.on('stream', (userVideoStream) => {
            addVideoStream(video, userVideoStream);
        });
        call.on('close', () => {
            video.remove();
        });
        console.log('this is the call', call);
        peers[otherId] = call;
    };
});

//------------------------------------------messaging-----------------------------------------------

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

function appendMessage(message, pos) {
    const appendedMessage = document.createElement('div');
    appendedMessage.classList.add("div");
    appendedMessage.classList.add(pos);
    appendedMessage.innerText = message;
    messageContainer.append(appendedMessage);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

//-------------------------------------------mute and stop video-----------------------------------------------

const muteSelf = document.getElementById('mute-self');
const stopVideo = document.getElementById('stop-video-self');

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

//-------------------------------------------Housekeeping-----------------------------------------------

window.addEventListener('unload', () => {
    console.log(socketDisconnected);
    if (socketDisconnected == false) {
        socket.disconnect();
    }
});

socket.on('user-disconnected', (name, otherId) => {
    if (peers[otherId]){
        peers[otherId].close(); //close cam
    }
    appendMessage(`${name} disconnected!`, center); //say user gone
    socketDisconnected = true;
    window.location.href = window.location.origin + '/room'; //redirect to home 
    console.log('redirected');
});

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    })
}