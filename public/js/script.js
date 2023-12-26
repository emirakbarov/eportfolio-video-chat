
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-message');
const sendMessage = document.getElementById('send-message-btn');
const right = 'right-message';
const left = 'left-message';
const center = 'center-message';

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