/**
 * Utility functions for JWT token inspection, validation, and expiration tracking.
 */

/**
 * Safely parse a JWT payload without external libraries.
 * @param {string} token
 * @returns {object|null} Decoded JSON payload or null if invalid
 */
export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT token payload:', error);
    return null;
  }
}

/**
 * Returns expiration epoch timestamp in milliseconds, or null if no exp claim.
 * @param {string} token
 * @returns {number|null} Expiration time in ms
 */
export function getTokenExp(token) {
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000;
}

/**
 * Checks whether a token is expired.
 * Includes a small grace buffer (default 3s) to prevent edge cases with network latency.
 * @param {string} token
 * @param {number} [bufferSeconds=3]
 * @returns {boolean} True if token is missing, malformed, or expired
 */
export function isTokenExpired(token, bufferSeconds = 3) {
  if (!token) return true;
  const expMs = getTokenExp(token);
  if (!expMs) return false;
  return Date.now() >= expMs - bufferSeconds * 1000;
}

/**
 * Calculates remaining milliseconds until the token expires.
 * @param {string} token
 * @returns {number} Remaining time in milliseconds (0 if already expired or invalid)
 */
export function getTokenRemainingTime(token) {
  if (!token) return 0;
  const expMs = getTokenExp(token);
  if (!expMs) return 0;
  return Math.max(0, expMs - Date.now());
}



