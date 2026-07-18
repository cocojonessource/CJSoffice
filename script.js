const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const responseMessage = document.getElementById("responseMessage");

yesButton.addEventListener("click", function () {
  responseMessage.textContent = "Welcome in. Your meeting is ready.";
});

noButton.addEventListener("click", function () {
  responseMessage.textContent =
    "Too late. Your appointment already started.";
  noButton.textContent = "Okay, let me in";
});
