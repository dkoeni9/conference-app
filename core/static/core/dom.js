import { formatTime } from "./shared.js";


export function createSpeakerButton(speaker) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "list-group-item list-group-item-action";
    button.dataset.id = speaker.id;
    button.dataset.name = speaker.full_name;
    button.dataset.timeLimit = speaker.time_limit_seconds;

    button.innerHTML = `
    <span class="speaker-name">${speaker.full_name}</span> —
    <span class="speaker-topic">${speaker.topic}</span> —
    <span class="speaker-time">${formatTime(speaker.time_limit_seconds)}</span>
    <span class="delete-speaker float-end text-danger" style="cursor:pointer;">&times;</span>
    `;

    return button;
}


export function addSpeakerButton(listElement, speaker) {
    const button = createSpeakerButton(speaker);
    listElement.appendChild(button);
}
