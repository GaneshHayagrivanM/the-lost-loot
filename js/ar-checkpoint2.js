import { gameState } from './game-state.js';
import { QUIZ_QUESTIONS } from './quiz-data.js';

// --- DOM Elements & A-Frame Scene ---
let instructionText;
let winMessage;

// --- Game Constants ---
const QUESTIONS_TO_WIN = 3;

// --- Game State ---
let gameActive = false;
let selectedQuestions = [];
let currentQuestionIndex = 0;
let quizContainer = null;

// --- Initialization ---
function initialize() {
    console.log("AR scene loaded. Initializing Checkpoint 2: The Kraken's Quiz...");
    const state = gameState.get();
    if (!state || state.completedCheckpoints.includes(2)) {
        instructionText.textContent = 'You have already completed this checkpoint!';
        return;
    }

    selectedQuestions = selectRandomQuestions(QUESTIONS_TO_WIN);
    createQuizScene();
    startGame();
}

function selectRandomQuestions(count) {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function createQuizScene() {
    instructionText.textContent = "Answer the Kraken's questions!";
    const feedbackContainer = document.getElementById('feedback-container');
    if (feedbackContainer) {
        feedbackContainer.classList.add('pirate-map');
    }

    const camera = document.querySelector('a-camera');

    quizContainer = document.createElement('a-entity');
    quizContainer.setAttribute('id', 'quiz-container');
    quizContainer.setAttribute('position', '0 0.2 -2'); // Position in front of the camera

    // The question will be displayed in the HTML UI, not in an a-text entity.

    // Create answer slate entities
    for (let i = 0; i < 3; i++) {
        const yPos = -0.25 * i; // Reverted spacing for mobile visibility
        const answerSlate = document.createElement('a-image');
        answerSlate.setAttribute('id', `answer-slate-${i}`);
        answerSlate.setAttribute('class', 'clickable'); // For event handling

        // IMPORTANT: The user needs to provide 'slate.png' in the assets folder.
        // The path below is a placeholder and should be updated to 'assets/slate.png'.
        answerSlate.setAttribute('src', 'assets/slate.png');

        answerSlate.setAttribute('width', '1');
        answerSlate.setAttribute('height', '0.24'); // Slightly smaller to prevent hitbox overlap
        answerSlate.setAttribute('position', `0 ${yPos} 0`);

        const answerText = document.createElement('a-text');
        answerText.setAttribute('id', `answer-text-${i}`);
        answerText.setAttribute('value', `Option ${i + 1}`);
        answerText.setAttribute('align', 'center');
        answerText.setAttribute('width', '2.5');
        answerText.setAttribute('position', '0 0 0.01'); // Slightly in front of the slate
        answerText.setAttribute('font', 'exo2bold');
        answerText.setAttribute('wrap-count', '30');
        answerText.setAttribute('color', 'black');
        answerSlate.appendChild(answerText);

        answerSlate.addEventListener('click', () => handleAnswerClick(i));
        quizContainer.appendChild(answerSlate);
    }

    camera.appendChild(quizContainer);
}

function startGame() {
    gameActive = true;
    currentQuestionIndex = 0;
    window.addEventListener('beforeunload', cleanup); // Add cleanup listener
    displayQuestion();
}

function displayQuestion() {
    const questionData = selectedQuestions[currentQuestionIndex];

    instructionText.textContent = questionData.question;

    for (let i = 0; i < 3; i++) {
        document.getElementById(`answer-text-${i}`).setAttribute('value', questionData.options[i]);
        // Ensure the slate is clickable for the new question
        const slate = document.getElementById(`answer-slate-${i}`);
        if (slate && !slate.classList.contains('clickable')) {
            slate.classList.add('clickable');
        }
    }
}

// --- Interaction Animations ---

function enlarge(entity) {
    // Remove any previous animations to avoid conflicts
    for (let i = 0; i < 6; i++) entity.removeAttribute(`animation__shake${i}`);
    entity.removeAttribute('animation__shake_return');

    entity.setAttribute('animation__enlarge', {
        property: 'scale',
        to: '1.2 1.2 1.2',
        dur: 200,
        dir: 'alternate',
        loop: 1
    });

    // Cleanup the animation component after it has finished
    setTimeout(() => entity.removeAttribute('animation__enlarge'), 400);
}

function shake(entity) {
    const originalPosition = entity.getAttribute('position');
    if (!originalPosition) return; // Can't shake if there's no position

    const shakeDuration = 50;
    const shakeMagnitude = 0.04;
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

    // Animation to return to original position
    entity.setAttribute('animation__shake_return', {
        property: 'position',
        to: originalPosition,
        dur: shakeDuration,
        delay: delay,
    });

    // Cleanup all shake animations after they are done
    setTimeout(() => {
        for (let i = 0; i < 6; i++) {
            entity.removeAttribute(`animation__shake${i}`);
        }
        entity.removeAttribute('animation__shake_return');
    }, delay + shakeDuration);
}


function handleAnswerClick(selectedIndex) {
    if (!gameActive) return;

    const questionData = selectedQuestions[currentQuestionIndex];
    const selectedOption = questionData.options[selectedIndex];
    const correctOption = questionData.answer;
    const slate = document.getElementById(`answer-slate-${selectedIndex}`);

    if (!slate) return; // Exit if slate not found

    // Disable clicks during animation
    slate.classList.remove('clickable');

    enlarge(slate);

    if (selectedOption === correctOption) {
        console.log("Correct answer!");
        // Prevent further clicks until the next question is displayed or the game ends.
        gameActive = false;

        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex >= QUESTIONS_TO_WIN) {
                winGame();
                // gameActive is not reset here because the quiz is over.
            } else {
                displayQuestion();
                gameActive = true; // Re-enable clicks for the new question
            }
        }, 1000);

    } else {
        console.log("Wrong answer!");
        setTimeout(() => {
            shake(slate);
            // Re-enable click on this slate after animation
            setTimeout(() => slate.classList.add('clickable'), 500);
        }, 200); // Delay shake to occur after enlarge
    }
}

function cleanup() {
    console.log("Cleaning up Checkpoint 2 assets and listeners...");
    gameActive = false;
    window.removeEventListener('beforeunload', cleanup);

    if (quizContainer && quizContainer.parentNode) {
        quizContainer.parentNode.removeChild(quizContainer);
        console.log("Quiz container removed from scene.");
    }
}

async function winGame() {
    console.log('You win the quiz!');
    cleanup(); // Perform cleanup

    try {
        // Save progress and then immediately redirect.
        await gameState.finishCheckpoint(2);
        window.location.href = 'hud.html';
    } catch (error) {
        // If saving fails, inform the user.
        instructionText.textContent = 'Error saving progress. Please try again.';
    }
}


// --- Start the script ---
// Wait for the DOM to be fully loaded before initializing
window.addEventListener('DOMContentLoaded', () => {
    instructionText = document.getElementById('instruction-text');
    winMessage = document.getElementById('win-message');
    const scene = document.querySelector('a-scene');

    if (scene) {
        if (scene.hasLoaded) {
            initialize();
        } else {
            scene.addEventListener('loaded', initialize);
        }
    } else {
        console.error('A-Frame scene not found, checkpoint initialization failed.');
    }
});
