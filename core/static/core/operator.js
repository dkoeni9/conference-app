import { formatTime } from "./shared.js";


function setSpeaker(speakerId) {
    const url = speakerId
        ? `/set_speaker/${speakerId}/`
        : `/set_speaker/`;
    fetch(url, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken,
            "Content-Type": "application/x-www-form-urlencoded",
        },
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


document.addEventListener("DOMContentLoaded", function () {
    const speakerSelect = document.getElementById("speaker-select");
    const currentSpeaker = document.getElementById("current-speaker");
    let speakerId = null;
    let timeLimit = 0;

    const timer = document.getElementById("timer");
    const addTimeBtn = document.getElementById("add-time-button");
    const extraTimeInput = document.getElementById("extra-time-input");

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
        // if (!speakerId || remainingTime === undefined) return;
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
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `extra_time=${extraTime}`
        });
        extraTimeInput.value = '';
    });


    let conferenceRunning = false;
    let timerInterval = null;

    const toggleBtn = document.querySelector("#toggle-conference-button");

    toggleBtn.addEventListener("click", () => {
        if (!speakerId) return;

        conferenceRunning = !conferenceRunning;
        toggleBtn.textContent = conferenceRunning ? "Остановить" : "Запустить";

        fetch(`/update_time/${speakerId}/`, {
            method: "POST",
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `action=${conferenceRunning ? "start" : "stop"}`
        });

        if (conferenceRunning) {
            timerInterval = setInterval(() => {
                timeLimit -= 1;
                timer.textContent = formatTime(timeLimit);

                fetch(`/update_time/${speakerId}/`, {
                    method: "POST",
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: "action=tick"
                });
            }, 1000);
        } else {
            clearInterval(timerInterval);
        }
    });
});



