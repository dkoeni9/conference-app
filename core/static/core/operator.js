import { csrfHeader, formatTime } from "./shared.js";


function setSpeaker(speakerId) {
    const url = speakerId
        ? `/set-speaker/${speakerId}/`
        : `/set-speaker/`;
    fetch(url, {
        method: "POST",
        headers: csrfHeader(),
        body: ""
    })
        .then((res) => {
            if (!res.ok) throw new Error("set_speaker failed");
            return res.json();
        })
        .then((data) => {
            console.log("set_speaker response:", data);
        })
        .catch((err) => console.error("set_speaker error:", err));
}

function refreshSpeakerOption(speaker) {
    const select = document.getElementById("speaker-select");
    const option = document.createElement("option");
    option.value = speaker.id;
    option.dataset.name = speaker.full_name;
    option.dataset.timeLimit = speaker.time_limit_seconds;
    option.textContent = `${speaker.full_name} — ${speaker.topic}`;
    select.appendChild(option);
}

document.addEventListener("DOMContentLoaded", function () {
    const speakerSelect = document.getElementById("speaker-select");
    const toggleBtn = document.querySelector("#toggle-conference-button");
    const timer = document.getElementById("timer");
    const extraTimeInput = document.getElementById("extra-time-input");
    const addTimeBtn = document.getElementById("add-time-button");
    const currentSpeaker = document.getElementById("current-speaker");

    let speakerId = null;
    let timeLimit = 0;

    let conferenceRunning = false;
    let timerInterval = null;

    speakerSelect.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];

        if (selectedOption.value) {
            speakerId = selectedOption.value;
            const speakerName = selectedOption.dataset.name;
            timeLimit = parseInt(selectedOption.dataset.timeLimit);

            currentSpeaker.textContent = speakerName;
            timer.textContent = formatTime(timeLimit);
            setSpeaker(speakerId);
        } else {
            currentSpeaker.textContent = '—';
            timer.textContent = '00:00';
            setSpeaker("");
        }
    });


    addTimeBtn.addEventListener("click", () => {
        if (!speakerId) return;

        const extraTime = parseInt(extraTimeInput.value) || 0;
        if (!extraTime) return;

        timeLimit += extraTime;
        timer.textContent = formatTime(timeLimit);

        const selectedOption = speakerSelect.options[speakerSelect.selectedIndex];
        if (selectedOption) {
            selectedOption.dataset.timeLimit = String(timeLimit);
        }

        fetch(`/update_time/${speakerId}/`, {
            method: "POST",
            headers: csrfHeader(),
            body: `extra_time=${extraTime}`
        });
        extraTimeInput.value = '';
    });


    toggleBtn.addEventListener("click", () => {
        if (!speakerId) return;

        conferenceRunning = !conferenceRunning;
        toggleBtn.textContent = conferenceRunning ? "Остановить" : "Запустить";

        fetch(`/update_time/${speakerId}/`, {
            method: "POST",
            headers: csrfHeader(),
            body: `action=${conferenceRunning ? "start" : "stop"}`
        });

        if (conferenceRunning) {
            timerInterval = setInterval(() => {
                timeLimit -= 1;
                timer.textContent = formatTime(timeLimit);

                fetch(`/update_time/${speakerId}/`, {
                    method: "POST",
                    headers: csrfHeader(),
                    body: "action=tick"
                });
            }, 1000);
        } else {
            clearInterval(timerInterval);
        }
    });


    document.getElementById("add-speaker-button").addEventListener("click", () => {
        const name = document.getElementById("new-speaker-name").value.trim();
        const topic = document.getElementById("new-speaker-topic").value.trim();
        const time = parseInt(document.getElementById("new-speaker-time").value, 10);

        if (!name || !topic || !time) {
            alert("Пожалуйста, заполните все поля");
            return;
        }

        // fetch("/operator/add_speaker/", {
        fetch("/add-speaker/", {
            method: "POST",
            headers: csrfHeader(),
            body: `full_name=${encodeURIComponent(name)}&topic=${encodeURIComponent(topic)}&time_limit_seconds=${time}`
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }
                refreshSpeakerOption(data);
                alert("Спикер добавлен!");
                document.getElementById("new-speaker-name").value = "";
                document.getElementById("new-speaker-topic").value = "";
                document.getElementById("new-speaker-time").value = "";
            })
            .catch(err => console.error("Ошибка добавления:", err));
    });


    document.getElementById("delete-speaker-button").addEventListener("click", () => {
        const select = document.getElementById("speaker-select");
        const id = select.value;
        if (!id) {
            return;
        }

        if (!confirm("Удалить выбранного спикера?")) return;

        // fetch(`/operator/delete_speaker/${id}/`, {
        fetch(`/delete-speaker/${id}/`, {
            method: "POST",
            headers: csrfHeader(),
            body: ""
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                if (data.success) {
                    select.querySelector(`option[value="${id}"]`).remove();

                    speakerId = null;
                    currentSpeaker.textContent = "—";
                    timer.textContent = "00:00";
                    speakerSelect.value = "";

                    alert("Спикер удалён.");
                } else {
                    alert("Ошибка удаления");
                }
            })
            .catch(err => console.error("Ошибка удаления:", err));
    });
});
