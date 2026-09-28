
require("dotenv").config();
const { Pool } = require("pg");

const path = require("path");

const express = require("express");

const app = express();

app.use(express.static(path.join(__dirname, "../frontend")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "FlowNotes API is running" });
});



app.get("/api/notes", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, content, due_date AS \"dueDate\", created_at AS \"createdAt\" FROM notes ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Could not load notes:", error.message);
    res.status(500).json({ error: "Could not load notes" });
  }
});

app.post("/api/notes", async (req, res) => {
  const content = req.body.content?.trim();
  const dueDate = req.body.dueDate || null;

  if (!content) {
    return res.status(400).json({ error: "Note content is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notes (content, due_date)
       VALUES ($1, $2)
       RETURNING id, content, due_date AS "dueDate", created_at AS "createdAt"`,
      [content, dueDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Could not create note:", error.message);
    res.status(500).json({ error: "Could not create note" });
  }
});

app.get("/api/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM notes");
    res.json({ noteCount: Number(result.rows[0].count) });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});