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


function refreshSpeakerCard(speaker) {
    const speakerList = document.getElementById("speaker-list");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "list-group-item list-group-item-action";
    btn.dataset.id = speaker.id;
    btn.dataset.name = speaker.full_name;
    btn.dataset.timeLimit = speaker.time_limit_seconds;

    btn.textContent = `${speaker.full_name} — ${speaker.topic} — ${formatTime(speaker.time_limit_seconds)}`;

    const deleteSpan = document.createElement("span");
    deleteSpan.className = "delete-speaker float-end text-danger";
    deleteSpan.style.cursor = "pointer";
    deleteSpan.innerHTML = "&times;";
    btn.appendChild(deleteSpan);

    speakerList.appendChild(btn);
}


document.addEventListener("DOMContentLoaded", function () {
    const speakerList = document.getElementById("speaker-list");
    const activeBtn = document.querySelector("#speaker-list .list-group-item.active");
    const toggleBtn = document.querySelector("#toggle-conference-button");
    const extraTimeInput = document.getElementById("extra-time-input");
    const addTimeBtn = document.getElementById("add-time-button");

    let speakerId = activeBtn?.dataset.id || null;
    let timeLimit = parseInt(activeBtn?.dataset.timeLimit || "0", 10);

    let conferenceRunning = false;
    let timerInterval = null;


    speakerList.addEventListener("click", function (e) {
        const btn = e.target.closest(".list-group-item");
        if (!btn) return;

        if (e.target.classList.contains("delete-speaker")) {
            e.stopPropagation();
            const speakerId = btn.dataset.id;
            if (!speakerId) return;
            if (!confirm("Удалить выбранного спикера?")) return;

            fetch(`/delete-speaker/${speakerId}/`, {
                method: "POST",
                headers: csrfHeader(),
                body: ""
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        btn.remove();
                        alert("Спикер удалён.");
                    } else {
                        alert("Ошибка удаления");
                    }
                })
                .catch(err => console.error("Ошибка удаления:", err));

            return;
        }

        document.querySelectorAll("#speaker-list .list-group-item")
            .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        speakerId = btn.dataset.id || "";
        timeLimit = parseInt(btn.dataset.timeLimit || "0", 10);

        setSpeaker(speakerId);
    });


    document.getElementById("time-control-form").addEventListener("submit", (e) => {
        e.preventDefault();

        if (!speakerId) return;

        const extraTime = parseInt(extraTimeInput.value) || 0;
        if (!extraTime) return;

        timeLimit += extraTime;

        const timeSpan = document.querySelector("#speaker-list .list-group-item.active .speaker-time");
        if (timeSpan) timeSpan.textContent = formatTime(timeLimit);

        const activeBtn = document.querySelector("#speaker-list .list-group-item.active");
        if (activeBtn) {
            activeBtn.dataset.timeLimit = String(timeLimit);
        }

        fetch(`/update_time/${speakerId}/`, {
            method: "POST",
            headers: csrfHeader(),
            body: `extra_time=${extraTime}`
        });

        e.target.reset();
    });


    toggleBtn.addEventListener("click", () => {
        if (!speakerId) return;

        conferenceRunning = !conferenceRunning;
        toggleBtn.textContent = conferenceRunning ? "Остановить таймер" : "Запустить таймер";
        toggleBtn.classList.toggle("btn-danger", conferenceRunning);
        toggleBtn.classList.toggle("btn-success", !conferenceRunning);

        fetch(`/update_time/${speakerId}/`, {
            method: "POST",
            headers: csrfHeader(),
            body: `action=${conferenceRunning ? "start" : "stop"}`
        });

        if (conferenceRunning) {
            timerInterval = setInterval(() => {
                timeLimit -= 1;

                const timeSpan = document.querySelector("#speaker-list .list-group-item.active .speaker-time");
                if (timeSpan) timeSpan.textContent = formatTime(timeLimit);

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


    document.getElementById("add-speaker-form").addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("new-speaker-name").value.trim();
        const topic = document.getElementById("new-speaker-topic").value.trim();
        const time = parseInt(document.getElementById("new-speaker-time").value, 10);

        if (!name || !topic || !time) {
            alert("Пожалуйста, заполните все поля");
            return;
        }

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

                refreshSpeakerCard(data);

                alert("Спикер добавлен!");

                document.getElementById("new-speaker-name").value = "";
                document.getElementById("new-speaker-topic").value = "";
                document.getElementById("new-speaker-time").value = "";
            })
            .catch(err => console.error("Ошибка добавления:", err));
    });
});
