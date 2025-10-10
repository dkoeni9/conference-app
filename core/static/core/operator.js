export function formatTime(timeLimit) {
    const minutes = Math.floor(timeLimit / 60);
    const seconds = timeLimit % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


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
        timer.textContent = formatTime(timeLimit + extraTime);
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
});
