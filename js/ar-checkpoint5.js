import { gameState } from './game-state.js';

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

    // The old mouseenter/mouseleave listeners are removed as they are unreliable
    // during a drag-and-drop operation.

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
        keyIcon.draggable = true; // Make the icon draggable
        keyIconsContainer.appendChild(keyIcon);

        // Drag and drop event listeners
        keyIcon.addEventListener('dragstart', (event) => {
            console.log('Drag Start:', { keyId: keyIcon.dataset.keyId });
            // Can't drag a used key
            if (keyIcon.classList.contains('used')) {
                console.log('Attempted to drag a used key. Preventing drag.');
                event.preventDefault();
                return;
            }
            selectedKey = keyIcon; // Set the selected key
            console.log('Selected Key:', selectedKey);
            // Add visual feedback for dragging
            setTimeout(() => keyIcon.classList.add('dragging'), 0);
        });

        keyIcon.addEventListener('dragend', () => {
            console.log('Drag End');
            keyIcon.classList.remove('dragging'); // Clean up visual feedback
            selectedKey = null; // Clear selection after drag ends
            console.log('Selected Key Cleared');
        });
    });
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

        // Add scene-wide drag and drop handlers
        scene.addEventListener('dragover', (event) => {
            // Prevent default behavior to allow dropping
            event.preventDefault();
        });

        scene.addEventListener('drop', (event) => {
            console.log('Drop Event Triggered');
            event.preventDefault();
            if (!selectedKey) {
                console.log('Drop event ignored: No key was selected.');
                return;
            }
            console.log('Processing drop for key:', selectedKey.dataset.keyId);

            // Manual raycasting for reliable drop detection
            const cameraEl = document.querySelector('#camera');
            const camera = cameraEl.getObject3D('camera');
            if (!camera) {
                console.error("Camera not found for raycasting.");
                return;
            }

            const screenPoint = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );
            console.log('Drop coordinates (normalized):', screenPoint);


            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(screenPoint, camera);

            const treasureChestModel = document.getElementById('treasure-chest-model');
            if (!treasureChestModel || !treasureChestModel.object3D) {
                console.warn('Treasure chest model not ready for raycasting.');
                return;
            }

            const intersects = raycaster.intersectObject(treasureChestModel.object3D, true);
            console.log('Raycaster intersections:', intersects);


            if (intersects.length > 0) {
                console.log('Intersection with treasure chest confirmed!');
                handleKeyInsertion();

                // Briefly make the chest glow to confirm the drop
                treasureChestModel.setAttribute('material', 'emissive: #00ff00; emissiveIntensity: 0.5');
                setTimeout(() => {
                    treasureChestModel.setAttribute('material', 'emissive: #000000; emissiveIntensity: 0');
                }, 500);
            } else {
                console.log('No intersection with treasure chest detected.');
            }
        });
    } else {
        console.error('A-Frame scene not found!');
        if(instructionText) {
            instructionText.textContent = 'Error: Could not load AR scene.';
        }
    }
});
