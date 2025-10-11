export function formatTime(timeLimit) {
    const sign = timeLimit < 0 ? "-" : "";
    const absTime = Math.abs(timeLimit);
    const minutes = Math.floor(absTime / 60);
    const seconds = absTime % 60;
    return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}