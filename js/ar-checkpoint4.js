import { gameState } from './game-state.js';

// --- DOM Elements & A-Frame Scene ---
const scene = document.querySelector('a-scene');
const instructionText = document.getElementById('instruction-text');
const winMessage = document.getElementById('win-message');

// --- Game Constants ---
const SYMBOLS = ["P", "I", "R", "A", "T", "E"];
const targetSequence = ["P", "I", "R", "A", "T", "E"];

// --- Game State ---
let gameActive = false;
let playerInput = [];
let resetting = false;

// --- Initialization ---
function initialize() {
  console.log("AR scene loaded. Initializing Checkpoint 4...");
  const state = gameState.get();
  if (!state || state.completedCheckpoints.includes(4)) {
    instructionText.textContent = 'You have already completed this checkpoint!';
    return;
  }

  createGameScene();
  startGame();

  // --- Register A-Frame Components ---
  window.AFRAME.registerComponent('billboard', {
    tick: function () {
      const cameraPos = this.el.sceneEl.camera.getWorldPosition(new window.THREE.Vector3());
      this.el.object3D.lookAt(cameraPos);
    }
  });
}

function createGameScene() {
  console.log("Creating 6 chest entities...");

  instructionText.textContent = "Tap the chests in the order: P-I-R-A-T-E";

  const radius = 15;
  const numChests = SYMBOLS.length;
  const angleStep = 360 / numChests;

  const gridPositions = [
    { x: radius * Math.cos(0), y: 0, z: radius * Math.sin(0) },
    { x: radius * Math.cos(Math.PI / 3), y: 0, z: radius * Math.sin(Math.PI / 3) },
    { x: radius * Math.cos(2 * Math.PI / 3), y: 0, z: radius * Math.sin(2 * Math.PI / 3) },
    { x: radius * Math.cos(Math.PI), y: 0, z: radius * Math.sin(Math.PI) },
    { x: radius * Math.cos(4 * Math.PI / 3), y: 0, z: radius * Math.sin(4 * Math.PI / 3) },
    { x: radius * Math.cos(5 * Math.PI / 3), y: 0, z: radius * Math.sin(5 * Math.PI / 3) },
  ];

  SYMBOLS.forEach((sym, i) => {
    const wrapper = document.createElement("a-entity");
    wrapper.setAttribute("position", `${gridPositions[i].x} ${gridPositions[i].y} ${gridPositions[i].z}`);

    // Calculate rotation angle based on index
    const rotationAngleY = 90 - (i * angleStep);
    wrapper.setAttribute("rotation", `0 ${rotationAngleY} 0`);
    wrapper.setAttribute("animation", `property: position; to: ${gridPositions[i].x } ${gridPositions[i].y + 1} ${gridPositions[i].z }; dir: alternate; dur: 2000; easing: easeInOutSine; loop: true`);

    // --- GLTF chest model ---
    const chest = document.createElement("a-entity");
    chest.setAttribute("gltf-model", "assets/treasure_chest.glb");
    chest.setAttribute("scale", "0.05 0.05 0.05");
    chest.setAttribute("position", "0 0 0");
    chest.setAttribute("rotation", "0 90 0");
    wrapper.appendChild(chest);

    // --- Invisible collider for click detection ---
    const collider = document.createElement("a-box");
    collider.setAttribute("class", "clickable");
    collider.setAttribute("position", "0 1.3 0");
    collider.setAttribute("scale", "8 6 5");
    collider.setAttribute("material", "opacity: 0; transparent: true");

    collider.addEventListener("click", (e) => {
      if (e.type === 'touchstart') e.preventDefault();
      console.log(`Chest ${sym} tapped!`);
      handleTap(sym, wrapper);
    });
    collider.addEventListener("touchstart", (e) => {
      e.preventDefault();
      console.log(`Chest ${sym} touched!`);
      handleTap(sym, wrapper);
    });

    wrapper.appendChild(collider);


scene.appendChild(wrapper);
});
}



function startGame() {
  gameActive = true;
  playerInput = [];
  console.log("Game started - awaiting chest taps...");
  window.addEventListener('beforeunload', cleanup);
}

function updateBoard() {
  const slots = document.getElementById("seq-board").querySelectorAll(".seq-slot");
  slots.forEach((s, i) => {
    if (i < playerInput.length) {
      s.classList.add("filled");
      s.textContent = playerInput[i];
    } else {
      s.classList.remove("filled");
      s.textContent = "•";
    }
  });
}

function showWrong() {
  const msg = document.getElementById("wrong-msg");
  msg.style.display = "block";
  setTimeout(() => msg.style.display = "none", 1000);
}

function resetInput() {
  playerInput = [];
  updateBoard();
  resetting = false;
}

// --- Animations ---
function enlarge(entity) {
  entity.removeAttribute('animation__enlarge');
  entity.setAttribute('animation__enlarge', {
    property: 'scale',
    to: '0.6 0.6 0.6',
    dur: 200,
    dir: 'alternate',
    loop: 1
  });
  setTimeout(() => entity.removeAttribute('animation__enlarge'), 400);
}

function shake(entity) {
  const originalPosition = entity.getAttribute('position');
  if (!originalPosition) return;

  const shakeDuration = 50;
  const shakeMagnitude = 0.1;
  let delay = 0;

  for (let i = 0; i < 6; i++) {
    const toX = originalPosition.x + (Math.random() - 0.5) * shakeMagnitude * 2;
    const toY = originalPosition.y + (Math.random() - 0.5) * shakeMagnitude;
    entity.setAttribute(`animation__shake${i}`, {
      property: 'position',
      to: { x: toX, y: toY, z: originalPosition.z },
      dur: shakeDuration,
      delay: delay,
    });
    delay += shakeDuration;
  }

  entity.setAttribute('animation__shake_return', {
    property: 'position',
    to: originalPosition,
    dur: shakeDuration,
    delay: delay,
  });

  setTimeout(() => {
    for (let i = 0; i < 6; i++) {
      entity.removeAttribute(`animation__shake${i}`);
    }
    entity.removeAttribute('animation__shake_return');
  }, delay + shakeDuration);
}

// --- Game Logic ---
function handleTap(sym, entity) {
  if (resetting || !gameActive) return;
  console.log(`Handling tap for ${sym}`);
  enlarge(entity);

  playerInput.push(sym);
  updateBoard();

  const idx = playerInput.length - 1;
  if (playerInput[idx] !== targetSequence[idx]) {
    resetting = true;
    showWrong();
    shake(entity);
    setTimeout(resetInput, 1000);
    return;
  }

  if (playerInput.length === targetSequence.length) {
    winGame();
  }
}

function cleanup() {
  console.log("Cleaning up Checkpoint 4 assets and listeners...");
  gameActive = false;
  window.removeEventListener('beforeunload', cleanup);
}

async function winGame() {
  console.log('All chests unlocked in order!');
  cleanup();

  winMessage.classList.remove('hidden');
  winMessage.innerHTML = '<h2>Success!</h2><p>Chests unlocked!</p>';

  try {
    await gameState.finishCheckpoint(4);
    console.log("Checkpoint 4 completed, redirecting...");
    setTimeout(() => {
      window.location.href = 'hud.html';
    }, 1500);
  } catch (error) {
    console.error("Error saving progress:", error);
    instructionText.textContent = 'Error saving progress. Please try again.';
  }
}

// --- Start the script ---
if (scene.hasLoaded) {
  initialize();
} else {
  scene.addEventListener('loaded', initialize);
}
