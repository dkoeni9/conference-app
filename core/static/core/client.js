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


const logo = document.getElementById("logo");
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

        // Show or hide logo and speaker info
        if (!data.current_speaker) {
            logo.classList.remove("d-none");
            logo.classList.add("d-block");

            speaker.classList.remove("d-block");
            speaker.classList.add("d-none");

            return;
        } else {
            speaker.classList.remove("d-none");
            speaker.classList.add("d-block");

            logo.classList.remove("d-block");
            logo.classList.add("d-none");
        }

        if (speakerName) speakerName.textContent = data.current_speaker || "-";
        if (speakerTopic) speakerTopic.textContent = `«${data.topic}»` || "-";
        const isRunning = !!data.is_running;
        const displaySeconds =
            data.time_limit != null ? data.time_limit : data.remaining_time || 0;
        if (isRunning) {
            speakerTime.textContent = formatTime(displaySeconds);
            speakerTime.classList.remove("d-none");
        } else {
            speakerTime.textContent = "";
            speakerTime.classList.add("d-none");
        }
    });
}

connectWebSocket();

window.addEventListener("beforeunload", () => {
    clearInterval(pingInterval);
    if (ws) ws.close();
});