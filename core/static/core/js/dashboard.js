import { api } from "./api.js";
import { addSpeakerButton, updateSpeakerItemStyles } from "./dom.js";
import { formatTime, parseTime } from "./shared.js";
import { state } from "./state.js";


document.addEventListener("DOMContentLoaded", function () {
    const speakerList = document.getElementById("speaker-list");
    const noSpeakerBtn = speakerList.querySelector(".no-number");
    const activeBtn = document.querySelector("#speaker-list .list-group-item.active");

    const timeControlForm = document.getElementById("time-control-form");
    const extraTimeInput = document.getElementById("extra-time-input");

    const onlyTimerToggle = document.getElementById("toggle-only-timer");

    const toggleConferenceBtn = document.querySelector("#toggle-conference-button");
    const resetTimeBtn = document.getElementById("reset-time-button");

    const beepSound = document.getElementById("beep-sound");
    let hasPlayedBeep = false;

    state.speakerId = activeBtn?.dataset.id || null;
    state.timeLimit = parseInt(activeBtn?.dataset.timeLimit || "0", 10);
    state.conferenceRunning = false;
    state.timerInterval = null;

    // Ensure initial state for delete icons
    updateSpeakerItemStyles();

    function renderTimeInSpan(timeSpan, seconds) {
        if (!timeSpan) return;
        timeSpan.textContent = formatTime(seconds);
        // toggle danger when <= 10 seconds
        timeSpan.classList.toggle("text-bg-danger", seconds <= 10);
    }

    function saveCurrentTimeToDataset(speakerId) {
        if (!speakerId) return;
        const btn = speakerList.querySelector(`.list-group-item[data-id="${speakerId}"]`);
        if (btn) {
            btn.dataset.timeLimit = String(state.timeLimit);
        }
    }


    speakerList.addEventListener("click", async (event) => {
        const btn = event.target.closest(".list-group-item");
        if (!btn) return;

        if (event.target.closest(".delete-speaker")) {
            event.stopPropagation();
            const speakerIdToDelete = btn.dataset.id;
            if (!speakerIdToDelete) return;
            // if (!confirm("Удалить выбранного спикера?")) return;

            try {
                // If the deleted speaker is the current one, reset state
                if (btn.classList.contains("active")) {
                    // Stop timer if running
                    if (state.conferenceRunning && state.speakerId) {
                        try {
                            state.conferenceRunning = false;
                            clearInterval(state.timerInterval);
                            state.timerInterval = null;

                            toggleConferenceBtn.textContent = "Запустить";
                            toggleConferenceBtn.classList.remove("btn-danger");
                            toggleConferenceBtn.classList.add("btn-success");

                            await api.updateTime(state.speakerId, "action=stop");
                        } catch (error) {
                            console.error("Ошибка при остановке таймера на сервере при удалении:", error);
                        }
                    }

                    // Reset state
                    noSpeakerBtn.classList.add("active");
                    state.speakerId = null;
                    await api.setSpeaker();

                    if (state.conferenceRunning) toggleConferenceBtn.click();
                }

                await api.deleteSpeaker(speakerIdToDelete);

                btn.remove();
                // Update delete icon styles after removal
                updateSpeakerItemStyles();

                // alert("Спикер удалён.");
            } catch (error) {
                console.error("Ошибка удаления:", error);
                alert(error.message);
            }

            return;
        }

        const prevSpeakerId = state.speakerId;
        const newSpeakerId = btn.dataset.id || "";

        // If the same speaker is clicked, do nothing
        if (prevSpeakerId === newSpeakerId) {
            return;
        }

        // Stop timer if switching speakers
        if ((state.conferenceRunning && prevSpeakerId) && (prevSpeakerId !== newSpeakerId)) {
            state.conferenceRunning = false;
            clearInterval(state.timerInterval);
            state.timerInterval = null;

            saveCurrentTimeToDataset(prevSpeakerId);

            toggleConferenceBtn.textContent = "Запустить";
            toggleConferenceBtn.classList.remove("btn-danger");
            toggleConferenceBtn.classList.add("btn-success");

            try {
                await api.updateTime(prevSpeakerId, "action=stop");
            } catch (error) {
                console.error("Ошибка при остановке таймера на сервере при переключении:", error);
            }
        }

        speakerList.querySelectorAll(".list-group-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        state.speakerId = btn.dataset.id || "";
        state.timeLimit = parseInt(btn.dataset.timeLimit || "0", 10);
        hasPlayedBeep = false;

        // Update delete icon styles when active speaker changes
        updateSpeakerItemStyles();

        await api.setSpeaker(state.speakerId);
    });


    timeControlForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!state.speakerId) return;

        const extraTime = parseTime(extraTimeInput.value);
        if (!extraTime) return;

        state.timeLimit = Math.max(0, state.timeLimit + extraTime);
        hasPlayedBeep = false;

        const timeSpan = speakerList.querySelector(".list-group-item.active .speaker-time");
        if (timeSpan) {
            renderTimeInSpan(timeSpan, state.timeLimit);
        }

        saveCurrentTimeToDataset(state.speakerId);

        try {
            await api.updateTime(state.speakerId, `extra_time=${extraTime}`);
        } catch (error) {
            console.error("Ошибка обновления времени:", error);
        }

        event.target.reset();
    });


    toggleConferenceBtn.addEventListener("click", async () => {
        if (!state.speakerId) return;

        state.conferenceRunning = !state.conferenceRunning;
        toggleConferenceBtn.textContent = state.conferenceRunning ? "Остановить" : "Запустить";
        toggleConferenceBtn.classList.toggle("btn-danger", state.conferenceRunning);
        toggleConferenceBtn.classList.toggle("btn-success", !state.conferenceRunning);

        await api.updateTime(state.speakerId, `action=${state.conferenceRunning ? "start" : "stop"}`);

        if (state.conferenceRunning) {
            hasPlayedBeep = false;

            state.timerInterval = setInterval(async () => {
                state.timeLimit = Math.max(0, state.timeLimit - 1);

                if (state.timeLimit === 0 && !hasPlayedBeep) {
                    hasPlayedBeep = true;
                    if (beepSound) {
                        beepSound.currentTime = 0;
                        beepSound.play().catch(err => console.warn("Beep play error:", err));
                    }
                } else if (state.timeLimit > 0) {
                    hasPlayedBeep = false;
                }

                const timeSpan = speakerList.querySelector(".list-group-item.active .speaker-time");
                if (timeSpan) {
                    renderTimeInSpan(timeSpan, state.timeLimit);
                }

                saveCurrentTimeToDataset(state.speakerId);

                try {
                    await api.updateTime(state.speakerId, "action=tick");
                } catch (error) {
                    console.error("Ошибка tick:", error);
                }
            }, 1000);
        } else {
            clearInterval(state.timerInterval);
            saveCurrentTimeToDataset(state.speakerId);
        }
    });


    document.getElementById("add-speaker-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("new-speaker-name").value.trim();
        const topic = document.getElementById("new-speaker-topic").value.trim();
        const time = parseTime(document.getElementById("new-speaker-time").value);

        // if (!name || !topic || !time) {
        //     alert("Пожалуйста, заполните все поля");
        //     return;
        // }

        try {
            const data = await api.addSpeaker(
                `full_name=${encodeURIComponent(name)}&topic=${encodeURIComponent(topic)}&time_limit=${time}`
            );


            addSpeakerButton(speakerList, data);
            // Ensure delete icon classes are correct for the new list
            updateSpeakerItemStyles();
            // alert("Спикер добавлен!");

            document.getElementById("new-speaker-name").value = "";
            document.getElementById("new-speaker-topic").value = "";
            document.getElementById("new-speaker-time").value = "";
        } catch (error) {
            console.error("Ошибка добавления:", error);
            alert(error.message);
        }
    });


    onlyTimerToggle.addEventListener("change", async () => {
        const value = !onlyTimerToggle.checked;
        const body = `show_name=${value}&show_topic=${value}`;

        try {
            await api.setVisibility(body);
        } catch (error) {
            console.error("Ошибка при сохранении видимости:", error);
        }
    });


    resetTimeBtn.addEventListener("click", () => {
        const activeBtn = document.querySelector("#speaker-list .list-group-item.active");
        if (!activeBtn) return;

        const currentTime = parseInt(activeBtn.dataset.timeLimit || "0", 10);
        if (currentTime <= 0) return;

        extraTimeInput.value = -currentTime;

        timeControlForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
});