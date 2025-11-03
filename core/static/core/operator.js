import { api } from "./api.js";
import { addSpeakerButton } from "./dom.js";
import { formatTime } from "./shared.js";
import { state } from "./state.js";


document.addEventListener("DOMContentLoaded", function () {
    const speakerList = document.getElementById("speaker-list");
    const noSpeakerBtn = speakerList.querySelector(".no-number");
    const activeBtn = document.querySelector("#speaker-list .list-group-item.active");
    const toggleBtn = document.querySelector("#toggle-conference-button");
    const extraTimeInput = document.getElementById("extra-time-input");

    state.speakerId = activeBtn?.dataset.id || null;
    state.timeLimit = parseInt(activeBtn?.dataset.timeLimit || "0", 10);
    state.conferenceRunning = false;
    state.timerInterval = null;


    speakerList.addEventListener("click", async (event) => {
        const btn = event.target.closest(".list-group-item");
        if (!btn) return;

        if (event.target.classList.contains("delete-speaker")) {
            event.stopPropagation();
            const speakerIdToDelete = btn.dataset.id;
            if (!speakerIdToDelete) return;
            if (!confirm("Удалить выбранного спикера?")) return;

            try {
                const data = await api.deleteSpeaker(speakerIdToDelete);

                if (btn.classList.contains("active")) {
                    noSpeakerBtn.classList.add("active");
                    state.speakerId = null;
                    await api.setSpeaker("");

                    if (state.conferenceRunning) toggleBtn.click();
                }

                btn.remove();
                alert("Спикер удалён.");
            } catch (error) {
                console.error("Ошибка удаления:", error);
                alert(error.message);
            }

            return;
        }

        speakerList.querySelectorAll(".list-group-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        state.speakerId = btn.dataset.id || "";
        state.timeLimit = parseInt(btn.dataset.timeLimit || "0", 10);

        await api.setSpeaker(state.speakerId);
    });


    document.getElementById("time-control-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!state.speakerId) return;

        const extraTime = parseInt(extraTimeInput.value) || 0;
        if (!extraTime) return;

        state.timeLimit += extraTime;

        const timeSpan = speakerList.querySelector(".list-group-item.active .speaker-time");
        if (timeSpan) timeSpan.textContent = formatTime(state.timeLimit);

        const activeBtn = speakerList.querySelector(".list-group-item.active");
        if (activeBtn) activeBtn.dataset.timeLimit = String(state.timeLimit);

        try {
            await api.updateTime(state.speakerId, `extra_time=${extraTime}`);
        } catch (error) {
            console.error("Ошибка обновления времени:", error);
        }

        event.target.reset();
    });


    toggleBtn.addEventListener("click", async () => {
        if (!state.speakerId) return;

        state.conferenceRunning = !state.conferenceRunning;
        toggleBtn.textContent = state.conferenceRunning ? "Остановить таймер" : "Запустить таймер";
        toggleBtn.classList.toggle("btn-danger", state.conferenceRunning);
        toggleBtn.classList.toggle("btn-success", !state.conferenceRunning);

        await api.updateTime(state.speakerId, `action=${state.conferenceRunning ? "start" : "stop"}`);

        if (state.conferenceRunning) {
            state.timerInterval = setInterval(async () => {
                state.timeLimit -= 1;

                const timeSpan = speakerList.querySelector(".list-group-item.active .speaker-time");
                if (timeSpan) timeSpan.textContent = formatTime(state.timeLimit);

                try {
                    await api.updateTime(state.speakerId, "action=tick");
                } catch (error) {
                    console.error("Ошибка tick:", error);
                }
            }, 1000);
        } else {
            clearInterval(state.timerInterval);
        }
    });


    document.getElementById("add-speaker-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("new-speaker-name").value.trim();
        const topic = document.getElementById("new-speaker-topic").value.trim();
        const time = parseInt(document.getElementById("new-speaker-time").value, 10);

        if (!name || !topic || !time) {
            alert("Пожалуйста, заполните все поля");
            return;
        }

        try {
            const data = await api.addSpeaker(
                `full_name=${encodeURIComponent(name)}&topic=${encodeURIComponent(topic)}&time_limit_seconds=${time}`
            );


            addSpeakerButton(speakerList, data);
            alert("Спикер добавлен!");

            document.getElementById("new-speaker-name").value = "";
            document.getElementById("new-speaker-topic").value = "";
            document.getElementById("new-speaker-time").value = "";
        } catch (error) {
            console.error("Ошибка добавления:", error);
            alert(error.message);
        }
    });
});
