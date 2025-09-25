import { gameState } from './game-state.js';
import { apiService } from './api-service.js';

// --- DOM Elements ---
const instructionText = document.getElementById('instruction-text');
const finalCheckpointContainer = document.getElementById('final-checkpoint-container');
const keyIconsContainer = document.getElementById('key-icons-container');
const coinGameContainer = document.getElementById('coin-game-container');
const finalWinMessage = document.getElementById('final-win-message');
const finalTimeEl = document.getElementById('final-time');

// --- Game State ---
let keysInserted = 0;
let selectedKey = null;

// --- Initialization ---
function initialize() {
    console.log("AR scene loaded. Initializing Checkpoint 5: The Lost Loot...");
    const state = gameState.get();

    // Pre-check
    if (!state || state.completedCheckpoints.length < 4 || state.keysCollected.length < 3) {
        instructionText.textContent = "You need all 3 keys and must complete all other challenges first!";
        return;
    }

    // Show the final challenge container
    finalCheckpointContainer.classList.remove('hidden');
    instructionText.textContent = "You've found the final challenge! Select a key, then tap the chest to unlock it.";

    setupARScene();
    createKeyIcons();
}

function setupARScene() {
    const scene = document.querySelector('a-scene'); // Correctly attach to the scene
    const treasureChest = document.createElement('a-gltf-model');
    treasureChest.setAttribute('id', 'treasure-chest-model');
    treasureChest.setAttribute('src', 'assets/treasure_chest.glb');
    treasureChest.setAttribute('position', '0 -1 -4');
    treasureChest.setAttribute('scale', '0.5 0.5 0.5');

    treasureChest.addEventListener('model-loaded', () => {
        console.log("Treasure chest model loaded.");
    });

    // Add click listener for the new interaction model
    treasureChest.addEventListener('click', () => {
        if (selectedKey) {
            handleKeyInsertion();
        }
    });

    scene.appendChild(treasureChest);
}

function createKeyIcons() {
    for (let i = 1; i <= 3; i++) {
        const keyIcon = document.createElement('div');
        keyIcon.classList.add('key-icon');
        keyIcon.dataset.keyId = i;
        keyIconsContainer.appendChild(keyIcon);

        keyIcon.addEventListener('click', () => {
            if (selectedKey) {
                selectedKey.classList.remove('selected');
            }
            selectedKey = keyIcon;
            selectedKey.classList.add('selected');
        });
    }
}

function handleKeyInsertion() {
    if (selectedKey && !selectedKey.classList.contains('used')) {
        selectedKey.classList.add('used');
        selectedKey.classList.remove('selected');
        keysInserted++;
        selectedKey = null;

        if (keysInserted === 3) {
            openChest();
        }
    }
}

function openChest() {
    instructionText.textContent = "The chest is unlocked! Get ready to collect the loot!";
    keyIconsContainer.style.display = 'none'; // Hide key icons

    setTimeout(() => {
        startCoinGame();
    }, 2000);
}

function startCoinGame() {
    instructionText.textContent = "Tap the gold coins to collect them!";
    let coinsCollected = 0;
    coinGameContainer.classList.remove('hidden');

    const coinInterval = setInterval(() => {
        const coin = document.createElement('div');
        coin.classList.add('gold-coin');
        coin.style.top = `${Math.random() * 80 + 10}%`;
        coin.style.left = `${Math.random() * 80 + 10}%`;
        coinGameContainer.appendChild(coin);

        coin.addEventListener('click', () => {
            coinsCollected++;
            coin.classList.add('collected');
            setTimeout(() => coin.remove(), 200);
        });

        setTimeout(() => {
            if (coin.parentNode) {
                coin.remove();
            }
        }, 1500);
    }, 500);

    setTimeout(() => {
        clearInterval(coinInterval);
        endGame(coinsCollected);
    }, 10000);
}

async function endGame(coinsCollected) {
    const teamId = gameState.getCurrentTeamId();
    if (teamId) {
        try {
            await apiService.endGame(teamId);
        } catch (error) {
            console.error("Failed to end game:", error);
        }
    }

    const state = gameState.get();
    const startTime = new Date(state.startTime).getTime();
    const endTime = Date.now();
    const elapsed = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const finalTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    finalTimeEl.textContent = finalTime;
    instructionText.textContent = `You collected ${coinsCollected} coins!`;
    finalWinMessage.classList.remove('hidden');
    coinGameContainer.classList.add('hidden');

    setTimeout(() => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }, 5000);
}

// --- Main ---
// Wait for the DOM to be fully loaded before trying to access A-Frame components.
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene) {
        if (scene.hasLoaded) {
            initialize();
        } else {
            scene.addEventListener('loaded', initialize);
        }
    } else {
        console.error('A-Frame scene not found!');
        instructionText.textContent = 'Error: Could not load AR scene.';
    }
});