import { gameState } from './js/game-state.js';

// --- DOM Elements ---
const compassNeedle = document.getElementById('compass-needle');
const instructionText = document.getElementById('instruction-text');
const winMessage = document.getElementById('win-message');
const progressIndicator = document.getElementById('progress-indicator');
const screenGlow = document.getElementById('screen-glow');

// --- Game Constants ---
const ROUNDS_TO_WIN = 3;
const HOLD_DURATION_MS = 3000;
const DIRECTIONS = {
    'North': 0, 'East': 90, 'South': 180, 'West': 270,
    'Northeast': 45, 'Southeast': 135, 'Southwest': 225, 'Northwest': 315
};
const TOLERANCE_DEGREES = 15;

// --- Game State ---
let gameActive = false;
let currentRound = 0;
let targetRounds = []; // e.g., ['North', 'West', 'Southeast']
let targetAngle = 0;
let holdTimer = null;

// --- Initialization ---
function initialize() {
    const state = gameState.get();
    if (!state) {
        instructionText.textContent = 'Game state not found. Please start from the HUD.';
        return;
    }
    if (state.completedCheckpoints.includes(1)) {
        instructionText.textContent = 'You have already completed this checkpoint!';
        return;
    }

    // Since this is markerless, we start the game immediately.
    startGame();
}

// --- Game Logic ---
function startGame() {
    gameActive = true;
    currentRound = 0;
    targetRounds = selectRandomDirections(ROUNDS_TO_WIN);
    console.log('Starting game with targets:', targetRounds);

    // Start listening to device orientation
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    startNextRound();
}

function startNextRound() {
    if (currentRound >= ROUNDS_TO_WIN) {
        winGame();
        return;
    }
    const targetName = targetRounds[currentRound];
    targetAngle = DIRECTIONS[targetName];
    instructionText.textContent = `Round ${currentRound + 1}/${ROUNDS_TO_WIN}: Find ${targetName}!`;
}

function handleDeviceOrientation(event) {
    if (!gameActive) return;

    // Use webkitCompassHeading for iOS compatibility, otherwise use alpha
    const heading = event.webkitCompassHeading || event.alpha;
    if (heading === null) return;

    // Rotate the 3D needle to match the device heading
    compassNeedle.setAttribute('rotation', { x: 0, y: 0, z: heading });

    const difference = Math.abs(heading - targetAngle);
    const isCorrect = Math.min(difference, 360 - difference) <= TOLERANCE_DEGREES;

    if (isCorrect) {
        if (holdTimer === null) { // Start the timer only once
            console.log('Correct direction held. Starting timer.');
            showFeedback(true);
            holdTimer = setTimeout(() => {
                console.log('Success! Round complete.');
                currentRound++;
                showFeedback(false); // Reset feedback before next round
                startNextRound();
            }, HOLD_DURATION_MS);
        }
    } else {
        if (holdTimer !== null) { // If player moves away, cancel the timer
            console.log('Moved away. Resetting timer.');
            clearTimeout(holdTimer);
            holdTimer = null;
            showFeedback(false);
        }
    }
}

async function winGame() {
    console.log('You win!');
    gameActive = false; // Stop the game logic
    clearTimeout(holdTimer);
    window.removeEventListener('deviceorientation', handleDeviceOrientation);

    winMessage.classList.remove('hidden');

    try {
        await gameState.finishCheckpoint(1);
        // Redirect back to HUD after a delay
        setTimeout(() => {
            window.location.href = 'hud.html';
        }, 4000);
    } catch (error) {
        instructionText.textContent = 'Error saving progress. Please try again.';
    }
}

// --- UI & Helpers ---
function showFeedback(isShowing) {
    if (isShowing) {
        screenGlow.classList.remove('hidden');
        progressIndicator.classList.remove('hidden');
        progressIndicator.style.animation = `progress ${HOLD_DURATION_MS / 1000}s linear`;
    } else {
        screenGlow.classList.add('hidden');
        progressIndicator.classList.add('hidden');
        progressIndicator.style.animation = 'none';
    }
}

function selectRandomDirections(count) {
    const directionKeys = Object.keys(DIRECTIONS);
    const shuffled = directionKeys.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// --- Start the script ---
initialize();
