function formatSeconds(s) {
    s = Number(s) || 0;
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

function ensureLogoOverlay() {
    let overlay = document.getElementById("logoOverlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "logoOverlay";
        overlay.textContent = "Логотип";
        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "96px",
            fontWeight: "700",
            background: "#ffffff",
            color: "#000000",
            zIndex: "9999",
        });
        document.body.appendChild(overlay);
    }
    return overlay;
}
const logoOverlay = ensureLogoOverlay();

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

    if (!data.current_speaker) {
        logoOverlay.style.display = "flex";
        if (nameEl) nameEl.textContent = "-";
        if (topicEl) topicEl.textContent = "-";
        if (timeEl) timeEl.textContent = "00:00";
        return;
    } else {
        logoOverlay.style.display = "none";
    }

    if (nameEl) nameEl.textContent = data.current_speaker || "-";
    if (topicEl) topicEl.textContent = data.topic || "-";
    // show configured time_limit (no countdown)
    const displaySeconds =
        data.time_limit != null ? data.time_limit : data.remaining_time || 0;
    if (timeEl) timeEl.textContent = formatSeconds(displaySeconds);
});
