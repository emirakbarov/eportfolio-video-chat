
const socket = io();

const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-message');
const sendMessage = document.getElementById('send-message-btn');
let name;
console.log(name);
do {
    name = prompt('What is your name?');
} while (name == null);

appendMessage(`You (${name}) joined`);
socket.emit('new-user', name);
socket.on('get-users', users => {
    appendMessage(checkForUsers(users));
});

socket.on('user-disconnected', (user, users) => {
    appendMessage(`${user} disconnected!`);
    appendMessage(checkForUsers(users, user));
});

socket.on('broadcast-user-join', name => {
    appendMessage(`${name} joined`);
});

socket.on('broadcast-message', (message, name) => {
    appendMessage(`${name}: ${message}`);
});

messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = document.getElementById('message');
    if (message.value != '') {
        socket.emit('send-message', message.value);
        appendMessage(`You: ${message.value}`);
        message.value = '';
    } else {
        alert('Please enter a message!');
    }
});

function appendMessage(message) {
    const appendedMessage = document.createElement('div');
    appendedMessage.classList.add("div");
    appendedMessage.innerText = message;
    messageContainer.append(appendedMessage);
}

function checkForUsers(users, deletedUser) {
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
document.addEventListener("DOMContentLoaded", function () {
    const handle = document.getElementById("resizable-handle");
    const chatContainer = document.getElementById("chat-container");
    const videoContainer = document.getElementById("video-container");

    const chatWidth = chatContainer.offsetWidth;
    const videoWidth = videoContainer.offsetWidth;
    console.log(chatWidth, videoWidth);

    let isDragging = false;

    handle.addEventListener("mousedown", function (event) {
        isDragging = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    });

    function handleMouseMove(event) {
        if (isDragging) {
            const newWidth = event.clientX / window.innerWidth * videoWidth;
            console.log(newWidth)
            console.log(newWidth / chatWidth > 0.5, newWidth / videoWidth > 0.5);
            if (newWidth / chatWidth > 0.5 || newWidth / videoWidth > 0.5) {
                videoContainer.style.width = `${newWidth}%`;
                chatContainer.style.width = `${100 - newWidth}%`;
            }
        }
    }

    function handleMouseUp() {
        isDragging = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    }
});
