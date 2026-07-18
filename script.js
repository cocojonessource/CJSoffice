const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const responseMessage = document.getElementById("responseMessage");

if (yesButton && noButton && responseMessage) {
  yesButton.addEventListener("click", function () {
    window.location.href = "lobby.html";
  });

  noButton.addEventListener("click", function () {
    responseMessage.textContent =
      "Too late. You're already here.";

    noButton.textContent = "Okay, let me in";

    noButton.addEventListener(
      "click",
      function () {
        window.location.href = "lobby.html";
      },
      { once: true }
    );
  });
}
