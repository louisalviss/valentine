const prompts = [
    "Are you sure?",
    "Really sure??",
    "Are you positive?",
    "Pookie please...",
    "Just think about it!",
    "If you say no, I will be really sad...",
    "I will be very sad...",
    "I will be very very very sad...",
    "Ok fine, I will stop asking...",
    "Just kidding, say yes please! ❤️"
];

let promptIndex = 0;

function handleNo() {
    const btnNo = document.querySelector('.no-button');
    const btnYes = document.querySelector('.yes-button');
    btnNo.textContent = prompts[promptIndex];
    promptIndex = (promptIndex + 1) % prompts.length;
    const currentSize = parseFloat(window.getComputedStyle(btnYes).fontSize);
    btnYes.style.fontSize = `${currentSize * 1.5}px`;
}

function handleYes() {
    window.location.href = "yes_page.html";
}
