import { formatTime } from "./operator.js";


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
        const displaySeconds =
            data.time_limit != null ? data.time_limit : data.remaining_time || 0;
        if (timeEl) timeEl.textContent = formatTime(displaySeconds);
    });
}

// Запуск
connectWebSocket();

// Очистка при закрытии страницы
window.addEventListener("beforeunload", () => {
    clearInterval(pingInterval);
    if (ws) ws.close();
});