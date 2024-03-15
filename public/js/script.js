
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-message');
const sendMessage = document.getElementById('send-message-btn');
const right = 'right-message';
const left = 'left-message';
const center = 'center-message';

// resize draggable
document.addEventListener("DOMContentLoaded",  () => {

    

    if (!localStorage.getItem('v') || localStorage.getItem('v') == false) {
        const v = document.getElementById('verification');
        v.style.animation = 'squeezeIn ease 0.2s forwards 1';
    }
    // load initial anims
    const title = document.getElementById('title');
    const desc = document.getElementById('desc');
    
    if (title && desc) {
        title.style.animation = "fadeIn ease 1s forwards";
        setTimeout(() => {
            desc.style.animation = "fadeIn ease 1s forwards"
        }, 200);
    }
    
    //load scroll anims:
    const ib = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                console.log('show ran');
            } else {
                entry.target.classList.remove('show');
            }
        });
    });

    const hidden = document.querySelectorAll('.hidden');
    hidden.forEach(el => ib.observe(el));

    const handle = document.getElementById("resizable-handle");
    const chatContainer = document.getElementById("chat-container");
    const videoContainer = document.getElementById("video-container");

    const chatWidth = chatContainer.offsetWidth;
    const videoWidth = videoContainer.offsetWidth;
    console.log(chatWidth, videoWidth);

    let isDragging = false;

    if (handle && chatContainer && videoContainer) {

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
    }
    if (JOIN_CODE != 0) {
        document.getElementById('message').placeholder = "Code: " + JOIN_CODE;
    }
});

const infoBtn = document.getElementById('info-btn');
const abtSafety = document.getElementById('abt-safety');

infoBtn.addEventListener('click',() => {
    abtSafety.style.animation = "squeezeIn ease 0.2s forwards 1";
});

const x = document.getElementById('close');
x.addEventListener('click', () => {
    abtSafety.style.animation = "squeezeOut ease 0.2s forwards 1";
});

const v = document.getElementById('verification');
const ver = document.getElementById('verify');

ver.addEventListener('submit', e => {
    e.preventDefault(); 
    const emailInput = ver.querySelector('[name=email]').value;
    if (emailInput.includes('@stu.acs-schools.com')) {
        v.style.animation = "squeezeOut ease 0.2s forwards 1";
        localStorage.setItem('v', true);
    }
});