// --- Mock Backend API Service ---

const USE_MOCK_BACKEND = true;
const API_LATENCY = 500; // in milliseconds

// This object acts as a simple in-memory "database" for the mock service.
let mockDatabase = {};

/**
 * Mocks the response for starting a new game.
 * @param {string} teamId - The ID of the team starting the game.
 * @returns {Promise<object>} A promise that resolves with the initial game state.
 */
function startGame(teamId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (USE_MOCK_BACKEND) {
                const now = new Date();
                const initialState = {
                    teamId: teamId,
                    startTime: now.toISOString(),
                    endTime: null,
                    completedCheckpoints: [],
                    unlockedCheckpoints: [1],
                    keysCollected: [],
                };
                // Store the initial state in our mock database
                mockDatabase[teamId] = initialState;
                console.log('Mock API: startGame successful', initialState);
                resolve(initialState);
            } else {
                // TODO: Implement real fetch call to POST /api/game/start
                reject(new Error("Real API not implemented."));
            }
        }, API_LATENCY);
    });
}

/**
 * Mocks the response for completing a checkpoint.
 * @param {string} teamId - The ID of the team.
 * @param {number} checkpointId - The ID of the completed checkpoint.
 * @returns {Promise<object>} A promise that resolves with the updated game state.
 */
function completeCheckpoint(teamId, checkpointId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (USE_MOCK_BACKEND) {
                const currentState = mockDatabase[teamId];
                if (!currentState) {
                    return reject(new Error("Game not started for this team."));
                }

                // Create a new state object to avoid mutation issues
                let updatedState = { ...currentState };

                if (checkpointId === 1) {
                    updatedState = {
                        ...updatedState,
                        completedCheckpoints: [1],
                        unlockedCheckpoints: [2, 3], // Unlocks next two checkpoints
                        keysCollected: [1], // Award the first key
                    };
                }
                // TODO: Add cases for other checkpoints as they are implemented

                // Update the database
                mockDatabase[teamId] = updatedState;
                console.log('Mock API: completeCheckpoint successful', updatedState);
                resolve(updatedState);
            } else {
                // TODO: Implement real fetch call to POST /api/checkpoint/complete
                reject(new Error("Real API not implemented."));
            }
        }, API_LATENCY);
    });
}

// Export the functions to be used by other modules
export const apiService = {
    startGame,
    completeCheckpoint,
};
