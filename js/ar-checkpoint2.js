import { gameState } from './game-state.js';
import { QUIZ_QUESTIONS } from './quiz-data.js';

// --- DOM Elements & A-Frame Scene ---
const scene = document.querySelector('a-scene');
const instructionText = document.getElementById('instruction-text');
const winMessage = document.getElementById('win-message');

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
    const camera = document.querySelector('a-camera');

    quizContainer = document.createElement('a-entity');
    quizContainer.setAttribute('id', 'quiz-container');
    quizContainer.setAttribute('position', '0 0.2 -2'); // Position in front of the camera

    // Create question text entity
    const questionText = document.createElement('a-text');
    questionText.setAttribute('id', 'question-text');
    questionText.setAttribute('value', 'Loading question...');
    questionText.setAttribute('align', 'center');
    questionText.setAttribute('width', '3');
    questionText.setAttribute('position', '0 0.5 0');
    quizContainer.appendChild(questionText);

    // Create answer plane entities
    for (let i = 0; i < 3; i++) {
        const yPos = -0.2 * i;
        const answerPlane = document.createElement('a-plane');
        answerPlane.setAttribute('id', `answer-plane-${i}`);
        answerPlane.setAttribute('class', 'clickable'); // For event handling
        answerPlane.setAttribute('width', '2');
        answerPlane.setAttribute('height', '0.3');
        answerPlane.setAttribute('position', `0 ${yPos} 0`);
        answerPlane.setAttribute('color', '#0077BE');

        const answerText = document.createElement('a-text');
        answerText.setAttribute('id', `answer-text-${i}`);
        answerText.setAttribute('value', `Option ${i + 1}`);
        answerText.setAttribute('align', 'center');
        answerText.setAttribute('width', '3.5');
        answerPlane.appendChild(answerText);

        answerPlane.addEventListener('click', () => handleAnswerClick(i));
        quizContainer.appendChild(answerPlane);
    }

    camera.appendChild(quizContainer);
}

function startGame() {
    gameActive = true;
    currentQuestionIndex = 0;
    displayQuestion();
}

function displayQuestion() {
    const questionData = selectedQuestions[currentQuestionIndex];

    document.getElementById('question-text').setAttribute('value', questionData.question);

    for (let i = 0; i < 3; i++) {
        document.getElementById(`answer-text-${i}`).setAttribute('value', questionData.options[i]);
        // Reset color on new question
        document.getElementById(`answer-plane-${i}`).setAttribute('color', '#0077BE');
    }
}

function handleAnswerClick(selectedIndex) {
    if (!gameActive) return;

    const questionData = selectedQuestions[currentQuestionIndex];
    const selectedOption = questionData.options[selectedIndex];
    const correctOption = questionData.answer;
    const plane = document.getElementById(`answer-plane-${selectedIndex}`);

    if (selectedOption === correctOption) {
        console.log("Correct answer!");
        plane.setAttribute('color', 'green');
        currentQuestionIndex++;

        setTimeout(() => {
            if (currentQuestionIndex >= QUESTIONS_TO_WIN) {
                winGame();
            } else {
                displayQuestion();
            }
        }, 1000);

    } else {
        console.log("Wrong answer!");
        plane.setAttribute('color', 'red');
        // Revert color after a delay to allow another try
        setTimeout(() => {
            plane.setAttribute('color', '#0077BE');
        }, 1000);
    }
}

async function winGame() {
    console.log('You win the quiz!');
    gameActive = false;
    quizContainer.setAttribute('visible', 'false'); // Hide the quiz

    winMessage.classList.remove('hidden');
    winMessage.innerHTML = '<h2>Success!</h2><p>The Kraken is impressed!</p>';

    try {
        await gameState.finishCheckpoint(2);
        setTimeout(() => {
            window.location.href = 'hud.html';
        }, 4000);
    } catch (error) {
        instructionText.textContent = 'Error saving progress. Please try again.';
    }
}


// --- Start the script ---
if (scene.hasLoaded) {
    initialize();
} else {
    scene.addEventListener('loaded', initialize);
}
