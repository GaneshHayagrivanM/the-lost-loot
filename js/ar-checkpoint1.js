// This is a diagnostic version of the file to isolate the bug.
// Step 1: Test if the scene 'loaded' event works correctly.

import { gameState } from './js/game-state.js';

function initialize() {
    console.log("DIAGNOSTIC: initialize() function called successfully!");
    // All other logic is temporarily removed.
}

// --- Start the script ---
// We must wait for the A-Frame scene to be fully loaded before starting the game logic
console.log("AR SCRIPT TEST: File is running. Waiting for scene to load...");
const scene = document.querySelector('a-scene');
if (scene.hasLoaded) {
    initialize();
} else {
    scene.addEventListener('loaded', initialize);
}
