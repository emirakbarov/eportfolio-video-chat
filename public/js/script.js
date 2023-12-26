
const socket = io();

const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-message');
const sendMessage = document.getElementById('send-message-btn');
let name;

const right = 'right-message';
const left = 'left-message';
const center = 'center-message';

console.log(name);
do {
    name = prompt('What is your name?');
} while (name == null);

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

function appendMessage(message, pos) {
    const appendedMessage = document.createElement('div');
    appendedMessage.classList.add("div");
    appendedMessage.classList.add(pos);
    appendedMessage.innerText = message;
    messageContainer.append(appendedMessage);
    messageContainer.scrollTop = messageContainer.scrollHeight
}
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
// resize draggable
document.addEventListener("DOMContentLoaded",  () => {
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
            const newWidth = event.clientX / window.innerWidth * 100; // new width as percentage
            if (newWidth > 25 && newWidth < 75) { // check if it is less than 25% of screen; 50% of original
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
