import { gameState } from './js/game-state.js';

// --- DOM Elements ---
const compassModel = document.getElementById('compass-gltf-model');
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

// --- Game & Model State ---
let gameActive = false;
let compassNeedle = null; // This will hold the THREE.js object for the needle
let currentRound = 0;
let targetRounds = [];
let targetAngle = 0;
let holdTimer = null;
let lastLogTime = 0; // For throttling console logs

// --- Initialization ---
function initialize() {
    console.log("AR scene loaded. Initializing script...");
    const state = gameState.get();
    if (!state) {
        instructionText.textContent = 'Game state not found. Please start from the HUD.';
        return;
    }
    if (state.completedCheckpoints.includes(1)) {
        instructionText.textContent = 'You have already completed this checkpoint!';
        return;
    }

    // Add event listeners for model loading
    compassModel.addEventListener('model-loaded', (e) => {
        console.log("Compass model has successfully loaded.");
        const model = e.detail.model; // This is a THREE.Group

        model.traverse((node) => {
            if (node.isMesh && node.name === 'Needle') {
                compassNeedle = node;
                console.log('Compass needle object found!');
            }
        });

        if (compassNeedle) {
            startGame();
        } else {
            instructionText.textContent = 'Error: Could not find "Needle" in 3D model.';
            console.error('Could not find mesh with name "Needle" in the GLTF model.');
        }
    });

    compassModel.addEventListener('model-error', (e) => {
        instructionText.textContent = 'Error: The 3D compass model failed to load.';
        console.error('Model loading failed:', e.detail);
    });
}


// --- Game Logic ---
function startGame() {
    gameActive = true;
    currentRound = 0;
    targetRounds = selectRandomDirections(ROUNDS_TO_WIN);
    console.log('Starting game with targets:', targetRounds);

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
    if (!gameActive || !compassNeedle) return;

    const heading = event.webkitCompassHeading || event.alpha;
    if (heading === null) return;

    // Log the heading once per second for debugging
    const now = Date.now();
    if (now - lastLogTime > 1000) {
        console.log(`Current device heading: ${Math.round(heading)}°`);
        lastLogTime = now;
    }

    // Rotate the 3D needle object directly.
    // We assume the model's default "up" is the Y-axis.
    // We convert degrees to radians and rotate around the Y axis.
    // Note: The rotation is negative to align with compass conventions.
    compassNeedle.rotation.y = -AFRAME.THREE.MathUtils.degToRad(heading);

    const difference = Math.abs(heading - targetAngle);
    const isCorrect = Math.min(difference, 360 - difference) <= TOLERANCE_DEGREES;

    if (isCorrect) {
        if (holdTimer === null) {
            console.log('Correct direction held. Starting timer.');
            showFeedback(true);
            holdTimer = setTimeout(() => {
                console.log('Success! Round complete.');
                currentRound++;
                showFeedback(false);
                startNextRound();
            }, HOLD_DURATION_MS);
        }
    } else {
        if (holdTimer !== null) {
            console.log('Moved away. Resetting timer.');
            clearTimeout(holdTimer);
            holdTimer = null;
            showFeedback(false);
        }
    }
}

async function winGame() {
    console.log('You win!');
    gameActive = false;
    clearTimeout(holdTimer);
    window.removeEventListener('deviceorientation', handleDeviceOrientation);

    winMessage.classList.remove('hidden');

    try {
        await gameState.finishCheckpoint(1);
        setTimeout(() => {
            window.location.href = 'hud.html';
        }, 4000);
    } catch (error) {
        instructionText.textContent = 'Error saving progress. Please try again.';
    }
}

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
const scene = document.querySelector('a-scene');
if (scene.hasLoaded) {
    initialize();
} else {
    scene.addEventListener('loaded', initialize);
}
