/**
 * Utility to get Beijing Time (UTC+8) in 'YYYY-MM-DD HH:mm:ss' format.
 * @param {number} [ms] - Optional timestamp in milliseconds. Defaults to now.
 * @returns {string}
 */
function getBeijingTime(ms) {
    if (!ms && ms !== 0) {
        const now = new Date();
        const beijingNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        return beijingNow.toISOString().replace('T', ' ').slice(0, 23);
    }
    if (typeof ms === 'string') {
        const trimmed = ms.trim();
        // If already in 'YYYY-MM-DD HH:mm:ss[.SSS]' format, return normalized
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,3})?$/.test(trimmed)) {
            return trimmed.length === 19 ? trimmed + '.000' : trimmed;
        }
        const parsed = new Date(trimmed.replace(' ', 'T'));
        if (isNaN(parsed.getTime())) return null;
        const beijingNow = new Date(parsed.getTime() + (8 * 60 * 60 * 1000));
        return beijingNow.toISOString().replace('T', ' ').slice(0, 23);
    }
    const now = new Date(ms);
    if (isNaN(now.getTime())) return null;
    const beijingNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    return beijingNow.toISOString().replace('T', ' ').slice(0, 23);
}

module.exports = { getBeijingTime };
