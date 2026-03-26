/**
 * Utility to get Beijing Time (UTC+8) in 'YYYY-MM-DD HH:mm:ss' format.
 * @param {number} [ms] - Optional timestamp in milliseconds. Defaults to now.
 * @returns {string}
 */
function getBeijingTime(ms) {
    const now = ms ? new Date(ms) : new Date();
    const beijingNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    // Include milliseconds (.SSS) — total length 23 for 'YYYY-MM-DD HH:mm:ss.SSS'
    return beijingNow.toISOString().replace('T', ' ').slice(0, 23);
}

module.exports = { getBeijingTime };
