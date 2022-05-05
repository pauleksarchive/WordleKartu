var socket, rowNumber = 1, atspeta = true;

const LetterPlacements = {
    Incorrect: 0,
    PartlyCorrect: 1,
    Correct: 2
}

const showToast = (text) => {
    alert(text);
}

const handleInput = () => {
    let input = document.getElementById('guess'), value = input.value.split('');
    if (rowNumber >= 6 || atspeta) return;

    for (let i = 0; i < 5; i++) {
        document.querySelector(`[data-place='${rowNumber}-${i + 1}']`).textContent = '';
    }

    value.forEach((letter, i) => {
        document.querySelector(`[data-place='${rowNumber}-${i+1}']`).textContent = letter.toUpperCase();
    });
    if (input.value.length == 5) {
        rowNumber++;
        socket.emit('guess', input.value);
        input.value = '';
    }
}

const focusOnInput = () => {
    document.getElementById('guess').focus();
    if (document.activeElement == document.getElementById('guess')) document.getElementById('notice').hidden = true;
}

const test = (text) => {
    fetch('./doesThisGameExist', { method: "POST", body: JSON.stringify({ code: text }) }).then(console.log);
}

let countdownInterval;
const updateCountdown = (countTo) => {
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        document.getElementById('timer').textContent = '⌚ ' + Math.max(Math.round((countTo - Date.now()) / 1000), 0);
    }, 1000);
    document.getElementById('timer').textContent = '⌚ ' + Math.max(Math.round((countTo - Date.now()) / 1000), 0);
}

const prisijungtiPrieZaidimo = async () => {
    let URL = new URLSearchParams(window.location.search), code = URL.get('code');
    if (!code) {
        showToast('Žaidimo kodas svetainės nuorodoje nerastas!');
        console.error('Couldn\'t find the game code in the URL');
        return window.location.href = '/';
    }

    let response = await fetch('./doesThisGameExist', { method: "POST", body: JSON.stringify({ code }) });
    if (!response.ok) {
        console.error(`Something went wrong while trying to load the game: ${response.statusText}`);
        showToast(`Žaidimo kambarys nerastas!`);
        return window.location.href = '/';
    }

    socket = io(`/${code}`);

    socket.on('room update', (data) => {
        let status = JSON.parse(data);
        document.getElementById('gameStatusName').textContent = "Tuojaus prisijungsi!";
        updateCountdown(status.status.until);
    });

    socket.on('answer feedback', (data) => {
        let status = JSON.parse(data), teisinguKiekis = 0;
        status.letters.forEach((letter, i) => {
            if (letter == LetterPlacements.Correct) {
                document.querySelector(`[data-place='${status.guesses}-${i + 1}']`).classList.add('correct');
                teisinguKiekis++
            }
            if (letter == LetterPlacements.PartlyCorrect) document.querySelector(`[data-place='${status.guesses}-${i + 1}']`).classList.add('partly-correct');
            if (letter == LetterPlacements.Incorrect) document.querySelector(`[data-place='${status.guesses}-${i + 1}']`).classList.add('incorrect');
            if (teisinguKiekis == 5) atspeta = true;
        });
    });

    socket.on('game start', (data) => {
        let status = JSON.parse(data);
        document.getElementById('gameStatusName').textContent = "Atspėk žodį!";
        document.getElementById('guess').value = '';
        updateCountdown(status.status.until);

        rowNumber = 1;
        atspeta = false;

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                document.querySelector(`[data-place='${i + 1}-${j + 1}']`).textContent = '';
                document.querySelector(`[data-place='${i + 1}-${j + 1}']`).classList.value = 'box';
            }
        }
    });

    socket.on('game end', (data) => {
        let status = JSON.parse(data);
        document.getElementById('gameStatusName').textContent = `Atsakymas: ${status.answer}`;
        updateCountdown(status.until);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    prisijungtiPrieZaidimo();
    document.getElementById('guess').value = '';
});