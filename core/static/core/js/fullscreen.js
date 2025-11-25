document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
});

document.addEventListener("fullscreenchange", () => {
    const header = document.querySelector("header");

    if (header) {
        header.classList.toggle("d-none", document.fullscreenElement);
    };

    document.body.classList.toggle("hide-cursor", document.fullscreenElement);
});
