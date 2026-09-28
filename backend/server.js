const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const { Pool } = require("pg");

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/api/notes", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, author, content,
              due_date AS "dueDate",
              created_at AS "createdAt"
       FROM notes
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Could not load notes:", error.message);
    res.status(500).json({ error: "Could not load notes." });
  }
});

app.post("/api/notes", async (req, res) => {
  const author =
    typeof req.body?.author === "string"
      ? req.body.author.trim()
      : "";
  const content =
    typeof req.body?.content === "string"
      ? req.body.content.trim()
      : "";
  const dueDate = req.body?.dueDate || null;

  if (!/^[A-Za-z0-9_ ]{2,30}$/.test(author)) {
    return res.status(400).json({
      error: "Choose a name between 2 and 30 characters."
    });
  }

  if (!content || content.length > 2000) {
    return res.status(400).json({
      error: "Note must be between 1 and 2000 characters."
    });
  }

  if (
    dueDate !== null &&
    (
      typeof dueDate !== "string" ||
      !Number.isFinite(Date.parse(dueDate)) ||
      Date.parse(dueDate) <= Date.now()
    )
  ) {
    return res.status(400).json({
      error: "Due date must be in the future."
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notes (author, content, due_date)
       VALUES ($1, $2, $3)
       RETURNING id, author, content,
                 due_date AS "dueDate",
                 created_at AS "createdAt"`,
      [author, content, dueDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Could not create note:", error.message);
    res.status(500).json({ error: "Could not create note." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});