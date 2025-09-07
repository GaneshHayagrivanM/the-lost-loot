// --- Live Backend API Service ---

const BASE_URL = 'https://lost-loot-api-178393477736.asia-south1.run.app/api/v1';

/**
 * A helper function to handle fetch responses.
 * @param {Response} response - The response from a fetch call.
 * @returns {Promise<object>} A promise that resolves with the JSON data.
 */
async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
    // Handle cases with no content, e.g., 204
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return {};
}


/**
 * Initializes a new game session or retrieves an existing one.
 * @param {string} teamId - The ID of the team starting the game.
 * @returns {Promise<object>} A promise that resolves with the game state.
 */
async function startGame(teamId) {
    const response = await fetch(`${BASE_URL}/game/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId }),
    });
    return handleResponse(response);
}

/**
 * Marks a checkpoint as completed.
 * @param {string} teamId - The ID of the team.
 * @param {number} checkpointId - The ID of the completed checkpoint.
 * @returns {Promise<object>} A promise that resolves with the updated game state.
 */
async function completeCheckpoint(teamId, checkpointId) {
    const response = await fetch(`${BASE_URL}/checkpoint/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId, checkpointId }),
    });
    return handleResponse(response);
}

/**
 * Retrieves the current game state for a team.
 * @param {string} teamId - The ID of the team.
 * @returns {Promise<object>} A promise that resolves with the current game state.
 */
async function getTeamStatus(teamId) {
    const response = await fetch(`${BASE_URL}/team/status/${teamId}`, {
        method: 'GET',
    });
    return handleResponse(response);
}


// Export the functions to be used by other modules
export const apiService = {
    startGame,
    completeCheckpoint,
    getTeamStatus,
};
