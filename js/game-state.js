// --- Game State Management ---

import { apiService } from './api-service.js';

const STATE_KEY = 'lostLootGameState';

/**
 * Retrieves the current game state from sessionStorage.
 * @returns {object | null} The game state object or null if not found.
 */
function getGameState() {
    const stateJSON = sessionStorage.getItem(STATE_KEY);
    return stateJSON ? JSON.parse(stateJSON) : null;
}

/**
 * Saves the game state to sessionStorage.
 * @param {object} state - The game state object to save.
 */
function saveGameState(state) {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
}

/**
 * A helper to get just the teamId from the current state.
 * @returns {string | null}
 */
function getCurrentTeamId() {
    const state = getGameState();
    return state ? state.teamId : null;
}

/**
 * Initializes the game for a new team.
 * @param {string} teamId
 * @returns {Promise<object>} A promise that resolves with the initial game state.
 */
async function initializeGame(teamId) {
    try {
        const initialState = await apiService.startGame(teamId);
        saveGameState(initialState);
        return initialState;
    } catch (error) {
        console.error("Failed to initialize game:", error);
        throw error;
    }
}

/**
 * Processes the completion of a checkpoint.
 * @param {number} checkpointId
 * @returns {Promise<object>} A promise that resolves with the updated game state.
 */
async function finishCheckpoint(checkpointId) {
    const teamId = getCurrentTeamId();
    if (!teamId) {
        throw new Error("Cannot complete checkpoint without a teamId.");
    }
    try {
        const updatedState = await apiService.completeCheckpoint(teamId, checkpointId);
        saveGameState(updatedState);
        return updatedState;
    } catch (error) {
        console.error(`Failed to complete checkpoint ${checkpointId}:`, error);
        throw error;
    }
}

/**
 * Fetches the latest game state from the server and updates sessionStorage.
 * @returns {Promise<object>} A promise that resolves with the latest game state.
 */
async function syncGameState() {
    const teamId = getCurrentTeamId();
    if (!teamId) {
        // Don't throw an error here, just return null if no game is active.
        return null;
    }
    try {
        const latestState = await apiService.getTeamStatus(teamId);
        saveGameState(latestState);
        return latestState;
    } catch (error) {
        console.error("Failed to sync game state:", error);
        throw error;
    }
}

export const gameState = {
    get: getGameState,
    save: saveGameState,
    getCurrentTeamId,
    initializeGame,
    finishCheckpoint,
    sync: syncGameState,
};
