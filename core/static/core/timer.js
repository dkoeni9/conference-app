document.addEventListener("DOMContentLoaded", function () {
    const speakerSelect = document.getElementById("speakerSelect");
    const timerElement = document.getElementById("timer");
    const currentSpeakerElement = document.getElementById("currentSpeaker");
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const addBtn = document.getElementById("addBtn");
    const extraInput = document.getElementById("extraInput");

    let remaining;
    let timerInterval = null;
    let currentSpeakerId = null;

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function setSpeakerOnServer(speakerId) {
        if (!speakerId) return;
        fetch(`/set_speaker/${speakerId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCookie("csrftoken"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "" // view only needs POST, no payload required
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

    function loadSpeakerTime(speakerId) {
        fetch(`/get_speaker_time/${speakerId}/`)
            .then(res => res.json())
            .then(data => {
                remaining = data.time_limit;
                timerElement.textContent = formatTime(remaining);
            });
    }

    speakerSelect.addEventListener("change", () => {
        currentSpeakerId = speakerSelect.value;
        if (!currentSpeakerId) return;
        currentSpeakerElement.textContent = speakerSelect.selectedOptions[0].text;
        if (timerInterval) clearInterval(timerInterval);
        loadSpeakerTime(currentSpeakerId);
        setSpeakerOnServer(currentSpeakerId);
    });

    startBtn.addEventListener("click", () => {
        if (!currentSpeakerId || remaining === undefined) return;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (remaining > 0) remaining -= 1;
            timerElement.textContent = formatTime(remaining);
        }, 1000);
    });

    stopBtn.addEventListener("click", () => {
        if (!currentSpeakerId || remaining === undefined) return;
        if (timerInterval) clearInterval(timerInterval);
        fetch(`/update_time/${currentSpeakerId}/`, {
            method: "POST",
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `remaining_time=${remaining}`
        });
    });

    addBtn.addEventListener("click", () => {
        if (!currentSpeakerId || remaining === undefined) return;
        const extra = parseInt(extraInput.value) || 0;
        remaining += extra;
        timerElement.textContent = formatTime(remaining);
        fetch(`/add_extra_time/${currentSpeakerId}/`, {
            method: "POST",
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `extra_time=${extra}`
        });
        extraInput.value = '';
    });

    // Инициализация первого спикера
    if (speakerSelect.value) {
        currentSpeakerId = speakerSelect.value;
        currentSpeakerElement.textContent = speakerSelect.selectedOptions[0].text;
        loadSpeakerTime(currentSpeakerId);
    }
});
