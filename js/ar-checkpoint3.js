import { gameState } from './game-state.js';

console.log("Mobile Pirate Ship Game loaded");

document.addEventListener('DOMContentLoaded', () => {
  const TIME_LIMIT = 30 * 1000;
  const SHIPS_TO_HIT = 3;

  let gameActive = true; // Game starts immediately
  let hits = 0;
  let startTime = Date.now(); // Start timer immediately
  let ships = [];
  let activeCannonballs = [];
  const shipPositions = [
    { x: -2, y: 0, z: -5 }, // Adjusted for markerless AR
    { x: 2, y: 0, z: -6 },
    { x: -1.5, y: 0, z: -4 }
  ];

  const scene = document.querySelector('a-scene');
  const camera = document.querySelector('a-camera');

  // Add assets
  const assets = document.createElement('a-assets');
  const shipModel = document.createElement('a-asset-item');
  shipModel.setAttribute('id', 'shipModel');
  shipModel.setAttribute('src', 'assets/compass.glb'); // Placeholder path
  assets.appendChild(shipModel);
  scene.appendChild(assets);

  // Add crosshair to camera
  const crosshair = document.createElement('a-ring');
  crosshair.setAttribute('position', '0 0 -1');
  crosshair.setAttribute('radius-inner', '0.01');
  crosshair.setAttribute('radius-outer', '0.02');
  crosshair.setAttribute('color', 'white');
  crosshair.setAttribute('material', 'opacity: 0.8');
  camera.appendChild(crosshair);

  // Create styles
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      overflow: hidden;
      font-family: Arial, sans-serif;
      background: #000;
    }
    #gameUI {
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      color: white;
      font-size: 16px;
      background: rgba(0,0,50,0.9);
      padding: 12px;
      border-radius: 8px;
      z-index: 9999;
      pointer-events: auto;
      border: 2px solid #4CAF50;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }
    #instructions {
      flex-basis: 100%;
      margin: 8px 0;
      line-height: 1.4;
    }
    #fireBtn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #FF4444;
      color: white;
      font-size: 18px;
      font-weight: bold;
      border: 4px solid white;
      z-index: 9999;
      display: block;
    }
    @media (max-width: 480px) {
      #gameUI {
        font-size: 14px;
        padding: 8px;
        top: 5px;
        left: 5px;
        right: 5px;
      }
      #fireBtn {
        width: 70px;
        height: 70px;
        font-size: 16px;
        bottom: 15px;
        right: 15px;
      }
    }
  `;
  document.head.appendChild(style);

  // Create UI
  const arUiOverlay = document.getElementById('ar-ui-overlay');
  if (arUiOverlay) {
    document.getElementById('instruction-text').style.display = 'none';
  }

  const gameUI = document.createElement('div');
  gameUI.id = 'gameUI';
  gameUI.innerHTML = `
    <div id="timer" style="margin-bottom: 6px;">Time: 30s</div>
    <div id="score" style="margin-bottom: 6px;">Ships Hit: 0/3</div>
    <div id="instructions">Battle in progress! Rotate phone to look around. Tap FIRE to shoot cannons!</div>
  `;
  (arUiOverlay || document.body).appendChild(gameUI);

  const fireBtn = document.createElement('button');
  fireBtn.id = 'fireBtn';
  fireBtn.textContent = 'FIRE!';
  document.body.appendChild(fireBtn);

  function createShips() {
    ships.forEach(ship => {
      if (ship.parentNode) ship.parentNode.removeChild(ship);
    });
    ships = [];

    shipPositions.forEach((pos, i) => {
      const ship = document.createElement('a-entity');
      ship.setAttribute('gltf-model', '#shipModel');
      ship.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
      ship.setAttribute('scale', '0.5 0.5 0.5'); // Adjusted for markerless
      ship.setAttribute('rotation', '0 180 0');
      ship.id = `ship${i}`;
      ship.classList.add('clickable');

      ship.addEventListener('model-loaded', () => {
        ship.object3D.traverse(node => {
          node.frustumCulled = false;
        });
        ship.setAttribute('visible', 'true');
        console.log(`Model loaded for ${ship.id}`);
      });

      ship.addEventListener('model-error', e => {
        console.error(`Model loading error for ${ship.id}:`, e.detail?.message || e);
      });

      scene.appendChild(ship);
      ships.push(ship);
    });

    console.log("Ships created:", ships.length);
  }

  function updateHitsUI() {
    document.getElementById('score').textContent = `Ships Hit: ${hits}/${SHIPS_TO_HIT}`;
    // Update sequence board
    const slots = document.querySelectorAll('.seq-slot');
    for (let i = 0; i < slots.length; i++) {
      if (i < hits) {
        slots[i].classList.add('filled');
      } else {
        slots[i].classList.remove('filled');
      }
    }
  }

  function fireCannonball() {
    if (!gameActive) {
      console.log("Cannot fire: game not active");
      return;
    }
    const camera = scene.querySelector('#camera');
    if (!camera) {
      console.error("Camera not found");
      return;
    }
    console.log("Firing cannonball");
    const cannonball = document.createElement('a-sphere');
    cannonball.setAttribute('radius', '0.2');
    cannonball.setAttribute('material', 'color: black; metalness: 0.9; roughness: 0.1; emissive: #222');
    cannonball.setAttribute('shadow', 'cast: true');

    const camPos = camera.object3D.position.clone();
    const camRotation = camera.object3D.rotation;
    const forward = new AFRAME.THREE.Vector3(0, 0, -1).applyEuler(camRotation);
    const startPos = camPos.clone().add(forward.clone().multiplyScalar(1));
    cannonball.object3D.position.copy(startPos);
    const velocity = forward.multiplyScalar(0.3);

    activeCannonballs.push({ entity: cannonball, velocity });
    scene.appendChild(cannonball);
    playFireEffect(startPos);

    if (navigator.vibrate) navigator.vibrate(100);
    console.log("Cannonball fired from:", startPos, "with velocity:", velocity);
  }

  function playFireEffect(position) {
    const flash = document.createElement('a-sphere');
    flash.setAttribute('radius', '0.5');
    flash.setAttribute('material', 'color: #FFD700; opacity: 1; emissive: #FFD700; emissiveIntensity: 1');
    flash.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
    scene.appendChild(flash);

    const smoke = document.createElement('a-sphere');
    smoke.setAttribute('radius', '0.3');
    smoke.setAttribute('material', 'color: #666; opacity: 0.5');
    smoke.setAttribute('position', `${position.x + 0.5} ${position.y + 0.2} ${position.z}`);
    smoke.setAttribute('animation', 'property: scale; to: 2 2 2; dur: 1000');
    scene.appendChild(smoke);

    setTimeout(() => {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
      if (smoke.parentNode) smoke.parentNode.removeChild(smoke);
    }, 300);
  }

  function checkCollision(cannonball, ship) {
    const distance = cannonball.object3D.position.distanceTo(ship.object3D.position);
    console.log("Collision check - Distance:", distance, "Ship visible:", ship.getAttribute('visible'));
    return distance < 2.5;
  }

  function gameLoop() {
    if (!gameActive) return;

    activeCannonballs.slice().forEach((ballWrapper, ballIndex) => {
      ballWrapper.entity.object3D.position.add(ballWrapper.velocity);

      if (ballWrapper.entity.object3D.position.length() > 20) { // Adjusted for markerless
        if (ballWrapper.entity.parentNode) ballWrapper.entity.parentNode.removeChild(ballWrapper.entity);
        activeCannonballs.splice(ballIndex, 1);
        console.log("Cannonball removed - too far");
        return;
      }

      ships.forEach(ship => {
        if (!ship.getAttribute('visible') || ship.getAttribute('visible') === 'false') return;

        if (checkCollision(ballWrapper.entity, ship)) {
          console.log("HIT DETECTED! Ship hit by cannonball");
          ship.setAttribute('visible', false);
          if (ballWrapper.entity.parentNode) ballWrapper.entity.parentNode.removeChild(ballWrapper.entity);
          activeCannonballs.splice(ballIndex, 1);

          hits++;
          updateHitsUI();
          createHitEffect(ship.object3D.position);

          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          console.log(`Ship destroyed! Total: ${hits}/${SHIPS_TO_HIT}`);

          if (hits >= SHIPS_TO_HIT) endGame(true);
        }
      });
    });

    requestAnimationFrame(gameLoop);
  }

  function enableVerticalPositionWithLookControls() {
    const camera = document.querySelector('#camera');
    if (!camera) return;

    let lastTouchY = null;
    const verticalSensitivity = 0.005;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) {
        lastTouchY = null;
        return;
      }
      lastTouchY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1 || lastTouchY === null) return;

      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;

      const pos = camera.object3D.position;
      pos.y += deltaY * verticalSensitivity;
      if (pos.y < 0.1) pos.y = 0.1;

      camera.object3D.position.set(pos.x, pos.y, pos.z);

      lastTouchY = touchY;
    }, { passive: true });

    window.addEventListener('touchend', () => {
      lastTouchY = null;
    });
    window.addEventListener('touchcancel', () => {
      lastTouchY = null;
    });
  }

  function createHitEffect(positionVec) {
    const explosion = document.createElement('a-sphere');
    explosion.setAttribute('radius', '0.5'); // Adjusted for markerless
    explosion.setAttribute('material', 'color: #FF4500; opacity: 1; emissive: #FF4500; emissiveIntensity: 1');
    explosion.setAttribute('position', `${positionVec.x} ${positionVec.y} ${positionVec.z}`);
    explosion.setAttribute('animation', 'property: scale; to: 1.5 1.5 1.5; dur: 600');
    scene.appendChild(explosion);

    for (let i = 0; i < 5; i++) {
      const debris = document.createElement('a-box');
      debris.setAttribute('scale', '0.1 0.1 0.1');
      debris.setAttribute('color', '#8B4513');
      debris.setAttribute('position',
        `${positionVec.x + (Math.random() - 0.5) * 2}
         ${positionVec.y + Math.random() * 1}
         ${positionVec.z + (Math.random() - 0.5) * 2}`);
      debris.setAttribute('animation',
        `property: position; to: ${positionVec.x + (Math.random() - 0.5) * 5} ${positionVec.y - 2.5} ${positionVec.z + (Math.random() - 0.5) * 5}; dur: 2000`);
      scene.appendChild(debris);
      setTimeout(() => {
        if (debris.parentNode) debris.parentNode.removeChild(debris);
      }, 2000);
    }

    setTimeout(() => {
      if (explosion.parentNode) explosion.parentNode.removeChild(explosion);
    }, 600);
  }

  function cleanup() {
    // Remove all created 3D elements, but keep UI for the end message
    if (assets.parentNode) assets.parentNode.removeChild(assets);
    if (crosshair.parentNode) crosshair.parentNode.removeChild(crosshair);
    ships.forEach(ship => {
        if (ship.parentNode) ship.parentNode.removeChild(ship);
    });
    activeCannonballs.forEach(ball => {
        if (ball.entity.parentNode) ball.entity.parentNode.removeChild(ball.entity);
    });
  }

  function endGame(won) {
    gameActive = false;
    cleanup(); // Call cleanup function
    document.getElementById('fireBtn').style.display = 'none';

    const message = won ?
      'Victory! All enemy ships destroyed! The seas are yours!' :
      'Time\'s up! The enemy ships escaped this time.';

    document.getElementById('instructions').innerHTML = `
      <div style="color: ${won ? '#4CAF50' : '#FF6B6B'}; font-weight: bold; margin-bottom: 10px; font-size: 16px;">
        ${message}
      </div>
    `;

    if (won) {
        // --- Finish the checkpoint ---
        gameState.finishCheckpoint(3).then(() => {
            console.log("Checkpoint 3 completed successfully!");
            // Optionally, redirect or show a final success message
            setTimeout(() => {
                window.location.href = 'hud.html';
            }, 4000);
        }).catch(error => {
            console.error("Failed to save checkpoint 3 progress:", error);
            // Display an error message to the user
            document.getElementById('instructions').textContent = 'Error saving progress. Please try again.';
        });

        document.getElementById('gameUI').style.display = 'none';
        const winMessage = document.getElementById('win-message');
        if (winMessage) {
            winMessage.classList.remove('hidden');
        }
    }
  }

  function startTimer() {
    const timerInterval = setInterval(() => {
      if (!gameActive) {
        clearInterval(timerInterval);
        return;
      }
      const elapsed = Date.now() - startTime;
      const timeLeft = Math.max(0, Math.ceil((TIME_LIMIT - elapsed) / 1000));
      document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame(false);
      }
    }, 100);
  }

  function setupMobileControls() {
    document.addEventListener('touchmove', e => {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    document.addEventListener('contextmenu', e => e.preventDefault());

    if (window.DeviceOrientationEvent) {
      console.log("Device orientation supported");
    }

    // Add touchstart for screen tap firing
    scene.addEventListener('touchstart', event => {
      if (gameActive && !event.target.closest('#gameUI') && !event.target.closest('#ar-ui-overlay') && event.target.tagName !== 'BUTTON') {
        console.log("Scene touched, firing cannonball");
        event.preventDefault();
        fireCannonball();
      }
    });

    // Add click for desktop testing
    scene.addEventListener('click', event => {
      if (gameActive && !event.target.closest('#gameUI') && !event.target.closest('#ar-ui-overlay') && event.target.tagName !== 'BUTTON') {
        console.log("Scene clicked, firing cannonball");
        fireCannonball();
      }
    });
  }

  // Initialize everything immediately
  setupMobileControls();
  enableVerticalPositionWithLookControls();

  // Set up fire button
  document.getElementById('fireBtn').onclick = () => {
    console.log("Fire button clicked");
    fireCannonball();
  };

  // Start the game immediately when scene is ready
  if (scene.hasLoaded) {
    createShips();
    updateHitsUI();
    requestAnimationFrame(gameLoop);
    startTimer();
    console.log("Game started immediately");
  } else {
    scene.addEventListener('loaded', () => {
      createShips();
      updateHitsUI();
      requestAnimationFrame(gameLoop);
      startTimer();
      console.log("Scene loaded - game started");
    });
  }

  // Debug AR.js initialization
  scene.addEventListener('arjs-video-loaded', () => {
    console.log("AR.js video feed loaded");
  });
  scene.addEventListener('arjs-error', e => {
    console.error("AR.js error:", e.detail);
  });

  console.log("Mobile pirate game initialized - game starts automatically!");
});
