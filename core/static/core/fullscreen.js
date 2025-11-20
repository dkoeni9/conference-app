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
    const alert = document.querySelector(".alert-container");

    if (!header) return;

    if (document.fullscreenElement) {
        header.style.display = "none";
        alert.style.display = "none";
    } else {
        header.style.display = "";
        alert.style.display = "";
    }
});
