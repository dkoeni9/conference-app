export function formatTime(timeLimit) {
    const sign = timeLimit < 0 ? "-" : "";
    const absTime = Math.abs(timeLimit);
    const minutes = Math.floor(absTime / 60);
    const seconds = absTime % 60;
    return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parses time input string into seconds.
 * Supports formats:
 *   "90"     -> 90
 *   "-10"    -> -10
 *   "1:30"   -> 90
 *   "-1:30"  -> -90
 */
export function parseTime(input) {
    if (!input) return null;

    const s = input.trim();

    // ±MM:SS Format
    if (s.includes(":")) {
        const sign = s.startsWith("-") ? -1 : 1;
        const clean = s.replace("-", "");

        const [mmStr, ssStr] = clean.split(":");
        const mm = parseInt(mmStr, 10);
        const ss = parseInt(ssStr, 10);

        if (
            Number.isNaN(mm) ||
            Number.isNaN(ss) ||
            mm < 0 ||
            ss < 0 ||
            ss > 59
        ) {
            return 0;
        }

        return sign * (mm * 60 + ss);
    }

    // ±SS Format
    const seconds = parseInt(s, 10);
    if (Number.isNaN(seconds)) return 0;

    return seconds;
}
