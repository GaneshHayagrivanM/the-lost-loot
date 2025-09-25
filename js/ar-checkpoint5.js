import { gameState } from './game-state.js';
import { apiService } from './api-service.js';

// --- DOM Elements ---
// These will be assigned once the DOM is loaded.
let instructionText;
let finalCheckpointContainer;
let keyIconsContainer;
let coinGameContainer;
let finalWinMessage;
let finalTimeEl;

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
    instructionText.textContent = "You've found the final challenge! Drag and drop the keys onto the treasure chest to unlock it.";

    setupARScene();
    createKeyIcons();
}

function setupARScene() {
    const scene = document.querySelector('a-scene'); // Correctly attach to the scene
    const treasureChest = document.createElement('a-gltf-model');
    treasureChest.setAttribute('id', 'treasure-chest-model');
    treasureChest.setAttribute('src', 'assets/treasure_chest.glb');

    treasureChest.setAttribute('position', '0 0 -11');
    treasureChest.setAttribute('scale', '0.07 0.04, 0.04');
    treasureChest.setAttribute("rotation", "0 270 0");

    treasureChest.addEventListener('model-loaded', () => {
        console.log("Treasure chest model loaded.");
    });

    // 'Tap' event listener for the chest
    treasureChest.addEventListener('click', () => {
        if (selectedKey) {
            handleKeyInsertion();
            // Briefly make the chest glow to confirm the tap
            treasureChest.setAttribute('material', 'emissive: #00ff00; emissiveIntensity: 0.5');
            setTimeout(() => {
                treasureChest.setAttribute('material', 'emissive: #000000; emissiveIntensity: 0');
            }, 500);
        }
    });

    scene.appendChild(treasureChest);
}

function createKeyIcons() {
    const state = gameState.get();
    if (!state) return;

    // Use the actual keys collected by the player
    state.keysCollected.forEach(keyId => {
        const keyIcon = document.createElement('div');
        keyIcon.classList.add('key-slot', 'collected');
        keyIcon.dataset.keyId = keyId;
        keyIcon.draggable = false; // No longer draggable
        keyIconsContainer.appendChild(keyIcon);

        // 'Select' event listener
        keyIcon.addEventListener('click', () => {
            if (keyIcon.classList.contains('used')) return;

            // Deselect any other selected key
            const currentlySelected = document.querySelector('.key-slot.selected');
            if (currentlySelected) {
                currentlySelected.classList.remove('selected');
            }

            // Select the new key
            keyIcon.classList.add('selected');
            selectedKey = keyIcon;
        });
    });
}

function handleKeyInsertion() {
    if (selectedKey && !selectedKey.classList.contains('used')) {
        selectedKey.classList.add('used');
        selectedKey.classList.remove('selected');
        selectedKey.style.visibility = 'hidden'; // Make the key disappear
        keysInserted++;
        selectedKey = null;

        if (keysInserted === 3) {
            openChest();
        }
    }
}

function openChest() {
    instructionText.textContent = "The chest is unlocked! You've found the Lost Loot!";
    keyIconsContainer.style.display = 'none'; // Hide key icons area

    // Call endGame directly, passing 0 for coins as they are no longer collected
    setTimeout(() => {
        endGame(0);
    }, 1500);
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
    instructionText.textContent = `Congratulations! You've found the Lost Loot!`;
    finalWinMessage.classList.remove('hidden');

    setTimeout(() => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }, 5000);
}

// --- Main ---
// Wait for the DOM to be fully loaded before trying to access A-Frame components.
document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements now that the DOM is ready
    instructionText = document.getElementById('instruction-text');
    finalCheckpointContainer = document.getElementById('final-checkpoint-container');
    keyIconsContainer = document.getElementById('key-icons-container');
    coinGameContainer = document.getElementById('coin-game-container');
    finalWinMessage = document.getElementById('final-win-message');
    finalTimeEl = document.getElementById('final-time');

    const scene = document.querySelector('a-scene');
    if (scene) {
        if (scene.hasLoaded) {
            initialize();
        } else {
            scene.addEventListener('loaded', initialize);
        }

        // Drag-and-drop listeners are no longer needed.
        // The 'click' listener on the treasure chest model handles the interaction.
    } else {
        console.error('A-Frame scene not found!');
        if(instructionText) {
            instructionText.textContent = 'Error: Could not load AR scene.';
        }
    }
});
