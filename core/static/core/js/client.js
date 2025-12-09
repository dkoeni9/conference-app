import { formatTime } from "./shared.js";

const CLEAR_CLIENT_STORAGE_ON_LOAD = true;

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
const speakerName = document.getElementById("speaker-name");
const speakerTopic = document.getElementById("speaker-topic");
const speakerTime = document.getElementById("speaker-time");

const beepSound = document.getElementById("beep-sound");
let hasPlayedBeep = false;

const scheme = window.location.protocol === "https:" ? "wss" : "ws";
const host = window.location.hostname || "127.0.0.1";
const port = window.location.port ? `:${window.location.port}` : "";

let ws;
let pingInterval;
let reconnectAttempts = 0;

let pendingShowName = true;
let pendingShowTopic = true;
let appliedShowName = true;
let appliedShowTopic = true;

function connectWebSocket() {
    ws = new WebSocket(`${scheme}://${host}${port}/ws/conference/`);

    ws.addEventListener("open", () => {
        console.info("✅ WS connected");
        reconnectAttempts = 0;

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

        // console.debug("📨 WS message:", data);

        // Handle timer update
        if (data.type === "timer_update") {
            handleTimerUpdate(data);
            return;
        }

        // Handle full update
        if (data.type === "full_update") {
            handleFullUpdate(data);
            return;
        }

        handleFullUpdate(data);
    });
}

function handleTimerUpdate(data) {
    const isRunning = !!data.is_running;
    const displaySeconds = data.time_limit || 0;

    if (!isRunning) {
        // If timer is not running, hide it
        if (speakerTime) {
            speakerTime.textContent = "";
            speakerTime.classList.add("d-none");
        }
        return;
    }

    // Update only timer display
    if (speakerTime) {
        speakerTime.textContent = formatTime(displaySeconds);
        speakerTime.classList.remove("d-none");

        speakerTime.classList.toggle("text-danger", displaySeconds <= 10);
        speakerTime.classList.toggle("blink", displaySeconds === 0);
    }

    // Handle beep sound
    if (displaySeconds === 0 && !hasPlayedBeep) {
        hasPlayedBeep = true;
        if (beepSound) {
            beepSound.currentTime = 0;
            beepSound.play().catch(err => console.warn("Beep play error:", err));
        }
    } else if (displaySeconds > 0) {
        hasPlayedBeep = false;
    }
}

function handleFullUpdate(data) {
    // Update pending flags
    if ("show_name" in data) pendingShowName = !!data.show_name;
    if ("show_topic" in data) pendingShowTopic = !!data.show_topic;

    // Show/hide speaker section/logo
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

    // Update speaker name and topic
    if (speakerName) {
        speakerName.textContent = data.current_speaker || "-";
    }
    if (speakerTopic) {
        speakerTopic.textContent = `«${data.topic}»` || "-";
    }

    const isRunning = !!data.is_running;
    const displaySeconds = data.time_limit != null ? data.time_limit : data.remaining_time || 0;

    if (isRunning) {
        if (speakerTime) {
            speakerTime.textContent = formatTime(displaySeconds);
            speakerTime.classList.remove("d-none");

            speakerTime.classList.toggle("text-danger", displaySeconds <= 10);
            speakerTime.classList.toggle("blink", displaySeconds === 0);
        }

        if (displaySeconds === 0 && !hasPlayedBeep) {
            hasPlayedBeep = true;
            if (beepSound) {
                beepSound.currentTime = 0;
                beepSound.play().catch(err => console.warn("Beep play error:", err));
            }
        } else if (displaySeconds > 0) {
            hasPlayedBeep = false;
        }

        if (speakerName) {
            speakerName.classList.toggle("d-none", !pendingShowName);
            appliedShowName = pendingShowName;
        }

        if (speakerTopic) {
            speakerTopic.classList.toggle("d-none", !pendingShowTopic);
            appliedShowTopic = pendingShowTopic;
        }
    } else {
        // Show name & topic when timer is not running
        if (speakerTime) {
            speakerTime.textContent = "";
            speakerTime.classList.add("d-none");
        }

        if (speakerName) {
            speakerName.classList.remove("d-none");
            appliedShowName = true;
        }
        if (speakerTopic) {
            speakerTopic.classList.remove("d-none");
            appliedShowTopic = true;
        }
    }
}

connectWebSocket();

window.addEventListener("beforeunload", () => {
    clearInterval(pingInterval);
    if (ws) ws.close();
});