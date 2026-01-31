/**
 * Mastermind Game Logic
 * Rules: 4 positions, 7 colors, NO duplicates, 10 turns.
 */

const CONFIG = {
    CODE_LENGTH: 4,
    COLORS: ['var(--color-1)', 'var(--color-2)', 'var(--color-3)', 'var(--color-4)', 'var(--color-5)', 'var(--color-6)', 'var(--color-7)'],
    MAX_TURNS: 10,
    TIMER_SECONDS: 600 // 10 minutes
};

const STATE = {
    secretCode: [],
    currentTurn: 0,
    currentGuess: Array(4).fill(null),
    history: [],
    timerInterval: null,
    timeLeft: CONFIG.TIMER_SECONDS,
    gameActive: false,
    selectedColorIndex: 0
};

// DOM Elements
const ui = {
    board: document.getElementById('game-board'),
    colorPicker: document.getElementById('color-picker'),
    submitBtn: document.getElementById('submit-guess'),
    newGameBtn: document.getElementById('new-game'),
    timerDisplay: document.getElementById('timer'),
    modal: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalRestart: document.getElementById('modal-restart'),
    secretReveal: document.getElementById('secret-reveal')
};

// Initialization
function init() {
    setupColorPicker();
    setupEventListeners();
    startNewGame();
}

function setupEventListeners() {
    ui.submitBtn.addEventListener('click', submitGuess);
    ui.newGameBtn.addEventListener('click', startNewGame);
    ui.modalRestart.addEventListener('click', () => {
        ui.modal.classList.add('hidden');
        startNewGame();
    });
}

function setupColorPicker() {
    ui.colorPicker.innerHTML = '';
    CONFIG.COLORS.forEach((color, index) => {
        const btn = document.createElement('div');
        btn.classList.add('color-option');
        btn.style.backgroundColor = color;
        btn.dataset.colorIndex = index;
        btn.addEventListener('click', () => selectColor(index));
        ui.colorPicker.appendChild(btn);
    });
}

function selectColor(index) {
    STATE.selectedColorIndex = index;
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
    ui.colorPicker.children[index].classList.add('active');
}

function startNewGame() {
    // Reset State
    STATE.secretCode = generateSecretCode();
    STATE.currentTurn = 0;
    STATE.history = [];
    STATE.gameActive = true;
    STATE.timeLeft = CONFIG.TIMER_SECONDS;
    resetCurrentGuess();

    // Reset UI
    renderBoard();
    updateTimerDisplay();
    startTimer();

    // Default select first color
    selectColor(0);

    console.log("Secret Code (for debugging):", STATE.secretCode);
}

function generateSecretCode() {
    const indices = [0, 1, 2, 3, 4, 5, 6];
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, CONFIG.CODE_LENGTH);
}

function resetCurrentGuess() {
    STATE.currentGuess = Array(CONFIG.CODE_LENGTH).fill(null);
    updateSubmitButton();
}

function startTimer() {
    clearInterval(STATE.timerInterval);
    STATE.timerInterval = setInterval(() => {
        if (!STATE.gameActive) return;

        STATE.timeLeft--;
        updateTimerDisplay();

        if (STATE.timeLeft <= 0) {
            endGame(false, "Time's up!");
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(STATE.timeLeft / 60);
    const seconds = STATE.timeLeft % 60;
    ui.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (STATE.timeLeft < 60) {
        ui.timerDisplay.style.color = 'var(--color-1)';
    } else {
        ui.timerDisplay.style.color = 'var(--text-secondary)';
    }
}

function renderBoard() {
    ui.board.innerHTML = '';

    // Create rows
    for (let i = 0; i < CONFIG.MAX_TURNS; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        if (i === STATE.currentTurn) row.classList.add('active');

        // Pegs
        const pegsDiv = document.createElement('div');
        pegsDiv.classList.add('pegs');

        for (let j = 0; j < CONFIG.CODE_LENGTH; j++) {
            const peg = document.createElement('div');
            peg.classList.add('peg');

            // Interaction for active row
            if (i === STATE.currentTurn && STATE.gameActive) {
                peg.addEventListener('click', () => placePeg(j));
            }

            // Display history or current guess
            let colorIndex = null;
            if (i < STATE.history.length) {
                // Past turn
                colorIndex = STATE.history[i].guess[j];
            } else if (i === STATE.currentTurn) {
                // Current turn
                colorIndex = STATE.currentGuess[j];
            }

            if (colorIndex !== null) {
                peg.style.backgroundColor = CONFIG.COLORS[colorIndex];
                peg.dataset.color = colorIndex; // For animation trigger
            }

            pegsDiv.appendChild(peg);
        }

        // Feedback
        const feedbackDiv = document.createElement('div');
        feedbackDiv.classList.add('feedback');

        if (i < STATE.history.length) {
            const result = STATE.history[i].result;
            // Render exact matches (Green)
            for (let k = 0; k < result.exact; k++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                dot.style.backgroundColor = 'var(--feedback-exact)';
                dot.style.opacity = '1';
                feedbackDiv.appendChild(dot);
            }
            // Render partial matches (Yellow)
            for (let k = 0; k < result.partial; k++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                dot.style.backgroundColor = 'var(--feedback-partial)';
                dot.style.opacity = '1';
                feedbackDiv.appendChild(dot);
            }
            // Empty dots are already there implicitly? No, need to fill
            const remaining = 4 - result.exact - result.partial;
            for (let k = 0; k < remaining; k++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                feedbackDiv.appendChild(dot);
            }
        } else {
            // Placeholder dots
            for (let k = 0; k < 4; k++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                feedbackDiv.appendChild(dot);
            }
        }

        row.appendChild(pegsDiv);
        row.appendChild(feedbackDiv);
        ui.board.appendChild(row);
    }
}

function placePeg(position) {
    if (!STATE.gameActive) return;
    STATE.currentGuess[position] = STATE.selectedColorIndex;
    renderBoard(); // Re-render to show new peg
    updateSubmitButton();
}

function updateSubmitButton() {
    const isComplete = STATE.currentGuess.every(val => val !== null);
    ui.submitBtn.disabled = !isComplete;
}

function submitGuess() {
    if (!STATE.gameActive) return;

    // Calculate result
    const guess = [...STATE.currentGuess];
    const result = checkGuess(guess, STATE.secretCode);

    // Save to history
    STATE.history.push({
        guess: guess,
        result: result
    });

    // Check Win/Loss
    if (result.exact === CONFIG.CODE_LENGTH) {
        endGame(true, "You cracked the code!");
        return;
    }

    STATE.currentTurn++;
    if (STATE.currentTurn >= CONFIG.MAX_TURNS) {
        endGame(false, "Out of turns!");
        return;
    }

    resetCurrentGuess();
    renderBoard();

    // Scroll to bottom (latest row)
    // In our CSS we use column-reverse, so the "bottom" is visual bottom, which is start of valid rows.
    // Actually column-reverse means first child is at bottom.
    // We append rows, so row 0 is at bottom.
}

function checkGuess(guess, secret) {
    let exact = 0;
    let partial = 0;

    // Since NO duplicates allowed, this is simpler
    // But let's write it robustly just in case rules change

    // 1. Exact matches
    for (let i = 0; i < CONFIG.CODE_LENGTH; i++) {
        if (guess[i] === secret[i]) {
            exact++;
        }
    }

    // 2. Partial matches
    // For "no duplicates", if color exists in secret but not at same index, it's a partial.
    // Since duplicates are NOT allowed, we can just check set intersection minus exact matches.

    // General algorithm for duplicates allowed (standard Mastermind):
    // Count frequencies in secret and guess (excluding exact matches)

    // Optimized for "No Duplicates":
    for (let i = 0; i < CONFIG.CODE_LENGTH; i++) {
        if (guess[i] !== secret[i] && secret.includes(guess[i])) {
            partial++;
        }
    }

    return { exact, partial };
}

function endGame(isWin, message) {
    STATE.gameActive = false;
    clearInterval(STATE.timerInterval);

    ui.modalTitle.textContent = isWin ? "YOU WIN!" : "GAME OVER";
    ui.modalMessage.textContent = message;

    // Reveal Secret
    ui.secretReveal.innerHTML = '';
    STATE.secretCode.forEach(colorIndex => {
        const peg = document.createElement('div');
        peg.classList.add('peg');
        peg.style.backgroundColor = CONFIG.COLORS[colorIndex];
        ui.secretReveal.appendChild(peg);
    });

    setTimeout(() => {
        ui.modal.classList.remove('hidden');
    }, 500);
}

// Start
init();
