import { formatTime } from "./shared.js";


export function createSpeakerButton(speaker) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "speaker-item list-group-item list-group-item-action";
    button.dataset.id = speaker.id;
    button.dataset.name = speaker.full_name;
    button.dataset.timeLimit = speaker.time_limit_seconds;

    const shortName = speaker.short_name ? speaker.short_name : speaker.full_name;

    button.innerHTML = `
    <span class="speaker-name fw-semibold">${shortName}</span>
    <span class="speaker-topic text-truncate ">&laquo;${speaker.topic}&raquo;</span>
    <span class="speaker-time badge text-bg-primary">${formatTime(speaker.time_limit_seconds)}</span>
    <span class="icon-wrapper delete-speaker text-dark">
        <!-- <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" stroke="currentColor" stroke-width=".2" viewBox="0 0 16 16"> -->
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
        </svg>
    </span>
    `;

    return button;
}


export function addSpeakerButton(listElement, speaker) {
    const button = createSpeakerButton(speaker);
    listElement.appendChild(button);
}


export function updateSpeakerItemStyles() {
    const speakerList = document.getElementById("speaker-list");

    speakerList.querySelectorAll(".list-group-item").forEach(item => {
        const deleteIcon = item.querySelector(".delete-speaker");
        const timeSpan = item.querySelector(".speaker-time");

        if (deleteIcon) {
            deleteIcon.classList.toggle("text-light", item.classList.contains("active"));
            deleteIcon.classList.toggle("text-dark", !item.classList.contains("active"));
        }

        if (timeSpan) {
            timeSpan.classList.toggle("text-bg-secondary", item.classList.contains("active"));
            timeSpan.classList.toggle("text-bg-primary", !item.classList.contains("active"));
        }
    });
}