const guestName = localStorage.getItem("flownoteGuestName");

if (!guestName) {
  window.location.replace("/login.html");
}
function updateActiveNavigation() {
  const isUpcoming =
    new URLSearchParams(window.location.search).get("view") === "upcoming";
  const isRecentNotes =
    !isUpcoming && window.location.hash === "#recent-notes";

  document
    .querySelector('a[href="/"]')
    ?.classList.toggle("active", !isUpcoming && !isRecentNotes);

  document
    .querySelector('a[href="/?view=upcoming"]')
    ?.classList.toggle("active", isUpcoming);

  document
    .querySelector('a[href="#recent-notes"]')
    ?.classList.toggle("active", isRecentNotes);
}

async function loadNotes() {
  const status = document.querySelector("#status");
  const list = document.querySelector("#notes");

  updateActiveNavigation();

  try {
    const response = await fetch("/api/notes");

    if (!response.ok) {
      throw new Error("The server could not load the notes.");
    }

    const notes = await response.json();
    const isUpcoming =
      new URLSearchParams(window.location.search).get("view") === "upcoming";

    const displayedNotes = isUpcoming
      ? notes
          .filter(
            (note) =>
              note.dueDate &&
              new Date(note.dueDate).getTime() > Date.now()
          )
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() -
              new Date(b.dueDate).getTime()
          )
      : notes;

    document.querySelector("#notes-title").textContent =
      isUpcoming ? "Upcoming" : "Recent notes";

    list.replaceChildren();

    for (const note of displayedNotes) {
      const item = document.createElement("li");
      item.className = "note-card";

      const header = document.createElement("div");
      header.className = "note-header";

      const avatar = document.createElement("span");
      avatar.className = "note-avatar";
      avatar.textContent = (note.author || "Guest").charAt(0).toUpperCase();

      const author = document.createElement("div");

      const name = document.createElement("strong");
      name.textContent = note.author || "Guest";

      const time = document.createElement("small");
      time.textContent = new Date(note.createdAt).toLocaleString("en-GB");

      author.append(name, time);
      header.append(avatar, author);

      const content = document.createElement("p");
      content.className = "note-content";
      content.textContent = note.content;

      item.append(header, content);

      if (note.dueDate) {
        const due = document.createElement("span");
        const dueTime = new Date(note.dueDate).getTime();
        const remaining = dueTime - Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;

        due.className = "due-badge";

        if (remaining <= 0) {
          item.classList.add("note-overdue");
          due.classList.add("due-overdue");
          due.textContent =
            `Overdue · ${new Date(note.dueDate).toLocaleString("en-GB")}`;
        } else {
          due.classList.add(
            remaining <= oneDay
              ? "due-soon"
              : remaining <= oneWeek
                ? "due-near"
                : "due-later"
          );
          due.textContent =
            `Due ${new Date(note.dueDate).toLocaleString("en-GB")}`;
        }

        item.appendChild(due);
      }

      list.appendChild(item);
    }

    status.textContent = displayedNotes.length === 0
      ? isUpcoming
        ? "No upcoming notes."
        : "No notes yet."
      : "";
  } catch (error) {
    status.textContent = "Could not load notes. Please try again.";
    console.error(error);
  }
}

const form = document.querySelector("#note-form");
const formStatus = document.querySelector("#form-status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const content = document.querySelector("#content").value.trim();
  const localDueDate = document.querySelector("#due-date").value;
  const dueDate = localDueDate
    ? new Date(localDueDate).toISOString()
    : null;

  if (dueDate && new Date(dueDate).getTime() <= Date.now()) {
    formStatus.textContent = "Choose a future due date.";
    return;
  }

  if (!content) return;

  formStatus.textContent = "Saving...";

  try {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  author: guestName,
  content,
  dueDate
})
    });

    if (!response.ok) {
      throw new Error("The note could not be saved.");
    }

    form.reset();
    formStatus.textContent = "Note published.";
    await loadNotes();
  } catch (error) {
    formStatus.textContent =
      "Could not publish the note. Please try again.";
    console.error(error);
  }
});

document.querySelector("#logout-button")?.addEventListener("click", () => {
  localStorage.removeItem("flownoteGuestName");
  window.location.assign("/login.html");
});

window.addEventListener("hashchange", updateActiveNavigation);

loadNotes();