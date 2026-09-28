async function loadNotes() {
  const status = document.querySelector("#status");
  const list = document.querySelector("#notes");

  try {
    const response = await fetch("/api/notes");

    if (!response.ok) {
      throw new Error("The server could not load the notes.");
    }

    const notes = await response.json();
    list.replaceChildren();

   
  for (const note of notes) {
  const item = document.createElement("li");
  item.className = "note-card";

  const header = document.createElement("div");
  header.className = "note-header";

  const avatar = document.createElement("span");
  avatar.className = "note-avatar";
  avatar.textContent = "F";

  const author = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = "FlowNote";
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
    due.className = "due-badge";
    due.textContent = `Due ${new Date(note.dueDate).toLocaleString("en-GB")}`;
    item.appendChild(due);
  }

  list.appendChild(item);

}

    status.textContent = notes.length === 0 ? "No notes yet." : "";
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
  const dueDate = localDueDate ? new Date(localDueDate).toISOString() : null;

  if (!content) return;

  formStatus.textContent = "Saving...";

  try {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, dueDate })
    });

    if (!response.ok) {
      throw new Error("The note could not be saved.");
    }

    form.reset();
    formStatus.textContent = "Note published.";
    await loadNotes();
  } catch (error) {
    formStatus.textContent = "Could not publish the note. Please try again.";
    console.error(error);
  }
});

loadNotes();