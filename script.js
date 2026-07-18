const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const responseMessage = document.getElementById("responseMessage");

yesButton.addEventListener("click", function () {
  responseMessage.textContent = "Welcome in. Your meeting is ready.";
});

noButton.addEventListener("click", function () {
  responseMessage.textContent =
    "Too late. You're already here.";
  noButton.textContent = "Okay, let me in";
});
