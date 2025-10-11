import { formatTime } from "./shared.js";


/*
An attempt to clear local/session storage to avoid reusing client-side persisted state.
*/
const CLEAR_CLIENT_STORAGE_ON_LOAD = true;

// Try to clear client-side storages to avoid remembering prior UI/session state.
if (CLEAR_CLIENT_STORAGE_ON_LOAD) {
    try {
        localStorage.clear();
    } catch (e) {
        console.warn('Could not clear localStorage', e);
    }
    try {
        sessionStorage.clear();
    } catch (e) {
        console.warn('Could not clear sessionStorage', e);
    }
}

function ensureLogoOverlay() {
    let overlay = document.getElementById("logo-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "logo-overlay";
        overlay.textContent = "Логотип";
        overlay.style.display = "none";
        document.body.appendChild(overlay);
    }
    return overlay;
}

const logoOverlay = ensureLogoOverlay();
const scheme = window.location.protocol === "https:" ? "wss" : "ws";
const host = window.location.hostname || "127.0.0.1";
const port = window.location.port ? `:${window.location.port}` : "";

let ws;
let pingInterval;
let reconnectAttempts = 0;

function connectWebSocket() {
    ws = new WebSocket(`${scheme}://${host}${port}/ws/conference/`);

    ws.addEventListener("open", () => {
        console.info("✅ WS connected");
        reconnectAttempts = 0;

        // Ping каждые 25 секунд (меньше типичного тайм-аута 30-60 сек)
        pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 25000);
    });

    ws.addEventListener("error", (e) => console.error("❌ WS error", e));

    ws.addEventListener("close", (event) => {
        console.warn("⚠️ WS closed", event.code);
        clearInterval(pingInterval);

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;

        console.info(`🔄 Reconnecting in ${delay / 1000}s...`);
        setTimeout(connectWebSocket, delay);
    });

    ws.addEventListener("message", (ev) => {
        const data = JSON.parse(ev.data);

        // Игнорируем pong
        if (data.type === "pong") return;

        console.debug("📨 WS message:", data);

        const speakerName = document.getElementById("speaker-name");
        const speakerTopic = document.getElementById("speaker-topic");
        const speakerTime = document.getElementById("speaker-time");

        if (!data.current_speaker) {
            logoOverlay.style.display = "flex";
            if (speakerName) speakerName.textContent = "-";
            if (speakerTopic) speakerTopic.textContent = "-";
            if (speakerTime) speakerTime.textContent = "00:00";
            return;
        } else {
            logoOverlay.style.display = "none";
        }

        if (speakerName) speakerName.textContent = data.current_speaker || "-";
        if (speakerTopic) speakerTopic.textContent = data.topic || "-";
        const displaySeconds =
            data.time_limit != null ? data.time_limit : data.remaining_time || 0;
        if (speakerTime) speakerTime.textContent = formatTime(displaySeconds);
    });
}

// Запуск
connectWebSocket();

// Очистка при закрытии страницы
window.addEventListener("beforeunload", () => {
    clearInterval(pingInterval);
    if (ws) ws.close();
});