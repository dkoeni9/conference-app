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


const logoWrapper = document.querySelector("#logo-wrapper");
const speaker = document.querySelector("#speaker");

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

        // Ping every 25 seconds 
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

        if (data.type === "pong") return;

        console.debug("📨 WS message:", data);

        const speakerName = document.getElementById("speaker-name");
        const speakerTopic = document.getElementById("speaker-topic");
        const speakerTime = document.getElementById("speaker-time");

        if (!data.current_speaker) {
            logoWrapper.style.display = "flex";
            speaker.style.display = "none";

            return;
        } else {
            logoWrapper.style.display = "none";
            speaker.style.display = "block";
        }

        if (speakerName) speakerName.textContent = data.current_speaker || "-";
        if (speakerTopic) speakerTopic.textContent = data.topic || "-";
        const displaySeconds =
            data.time_limit != null ? data.time_limit : data.remaining_time || 0;
        if (speakerTime) speakerTime.textContent = formatTime(displaySeconds);
    });
}

connectWebSocket();

window.addEventListener("beforeunload", () => {
    clearInterval(pingInterval);
    if (ws) ws.close();
});