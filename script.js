// ==============================
// SOURCE'S OFFICE
// Main Office System
// ==============================

const Office = {

    profile: localStorage.getItem("sourceOfficeProfile") || "public",

    init() {

        this.setupReception();
        this.setupLobby();

    },

    setupReception() {

        const yesButton = document.getElementById("yesButton");
        const noButton = document.getElementById("noButton");
        const responseMessage = document.getElementById("responseMessage");

        if (!yesButton) return;

        yesButton.addEventListener("click", () => {
            window.location.href = "lobby.html";
        });

        noButton.addEventListener("click", () => {

            responseMessage.textContent =
                "Too late. You're already here.";

            noButton.textContent = "Okay, let me in";

            noButton.onclick = () => {
                window.location.href = "lobby.html";
            };

        });

    },

    setupLobby() {

        const notificationButton =
            document.getElementById("notificationButton");

        const notificationPanel =
            document.getElementById("notificationPanel");

        const notificationCount =
            document.getElementById("notificationCount");

        if (!notificationButton) return;

        notificationButton.addEventListener("click", () => {

            notificationPanel.classList.toggle("open");

            const open =
                notificationPanel.classList.contains("open");

            notificationButton.setAttribute(
                "aria-expanded",
                open
            );

            notificationPanel.setAttribute(
                "aria-hidden",
                !open
            );

            if (open && notificationCount) {
                notificationCount.style.display = "none";
            }

        });

    },

    // ==========================
    // Future Features
    // ==========================

    saveProgress(page) {

        localStorage.setItem(
            "lastMeeting",
            page
        );

    },

    getProgress() {

        return localStorage.getItem(
            "lastMeeting"
        );

    },

    saveAudio(time) {

        localStorage.setItem(
            "audioPosition",
            time
        );

    },

    getAudio() {

        return localStorage.getItem(
            "audioPosition"
        );

    },

    saveHighlight(text) {

        console.log(
            "Highlight saved:",
            text
        );

    },

    saveStickyNote(note) {

        console.log(
            "Sticky note:",
            note
        );

    },

    updateWhiteboard() {

        console.log(
            "Whiteboard updated."
        );

    }

};

Office.init();
