function formatSeconds(s) {
    s = Number(s) || 0;
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

const scheme = window.location.protocol === "https:" ? "wss" : "ws";
const host = window.location.hostname || "127.0.0.1";
const port = window.location.port ? `:${window.location.port}` : "";
const ws = new WebSocket(`${scheme}://${host}${port}/ws/conference/`);

ws.addEventListener("open", () => console.info("WS connected"));
ws.addEventListener("error", (e) => console.error("WS error", e));
ws.addEventListener("close", () => console.info("WS closed"));

ws.addEventListener("message", (ev) => {
    const data = JSON.parse(ev.data);
    console.debug("WS message:", data);

    const nameEl = document.getElementById("speaker-name");
    const topicEl = document.getElementById("speaker-topic");
    const timeEl = document.getElementById("speaker-time");

    if (nameEl) nameEl.textContent = data.current_speaker || "-";
    if (topicEl) topicEl.textContent = data.topic || "-";
    // show configured time_limit (no countdown)
    const displaySeconds =
        data.time_limit != null ? data.time_limit : data.remaining_time || 0;
    if (timeEl) timerEl.textContent = formatSeconds(displaySeconds);
});
