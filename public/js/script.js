const socket = io();

const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-message');
const sendMessage = document.getElementById('send-message-btn');
const name = prompt('What is your name?');

appendMessage(`You (${name}) joined`);
socket.emit('new-user', name);
socket.on('get-users', users => {
    if (Object.keys(users).length < 2) {
        appendMessage('No users in the chat apart from you!');
    } else {
        const userListString = Object.values(users).join(', ');
        appendMessage(`Users in the chat: ${userListString}`);
    }
});

socket.on('user-disconnected', user => {
    appendMessage(`${name} disconnected!`);
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
    appendedMessage.innerText = message;
    messageContainer.append(appendedMessage);
}