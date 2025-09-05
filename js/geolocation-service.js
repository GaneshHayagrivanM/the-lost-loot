// --- Geolocation Service ---

// This service handles all interactions with the browser's Geolocation API.

/**
 * Calculates the distance between two GPS coordinates in meters using the Haversine formula.
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} The distance in meters.
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
}

/**
 * Calculates the bearing from point 1 to point 2.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Bearing in degrees.
 */
function getBearing(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const λ1 = lon1 * Math.PI / 180;
    const λ2 = lon2 * Math.PI / 180;

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const θ = Math.atan2(y, x);
    const brng = (θ * 180 / Math.PI + 360) % 360; // in degrees
    return brng;
}


/**
 * Starts watching the user's position.
 * @param {function} onUpdate - Callback function for successful position updates.
 * @param {function} onError - Callback function for errors (e.g., permission denied).
 * @returns {number} The watch ID, which can be used to stop tracking.
 */
function startTracking(onUpdate, onError) {
    if (!navigator.geolocation) {
        onError({ code: -1, message: "Geolocation is not supported by your browser." });
        return null;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
    };

    const watchId = navigator.geolocation.watchPosition(onUpdate, onError, options);
    return watchId;
}

/**
 * Stops watching the user's position.
 * @param {number} watchId - The ID returned by startTracking.
 */
function stopTracking(watchId) {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
}

export const geolocationService = {
    getDistance,
    getBearing,
    startTracking,
    stopTracking,
};
