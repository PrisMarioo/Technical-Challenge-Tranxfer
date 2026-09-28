const form = document.querySelector("#guest-form");
const status = document.querySelector("#guest-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.querySelector("#username").value.trim();

  if (!/^[A-Za-z0-9_ ]{2,30}$/.test(name)) {
    status.textContent =
      "Use 2–30 letters, numbers, spaces or underscores.";
    return;
  }

  localStorage.setItem("flownoteGuestName", name);
  window.location.assign("/");
});