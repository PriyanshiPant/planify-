const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

console.log("MONGO_URI:", process.env.MONGO_URI);

const app = express();


app.use(express.json());
app.use(cors());

// ===== MongoDB Connection =====
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ===== Define Schemas =====
const taskSchema = new mongoose.Schema({
  date: String,
  text: String,
  completed: Boolean,
});

const noteSchema = new mongoose.Schema({
  title: String,
  body: String,
});

const Task = mongoose.model("Task", taskSchema);
const Note = mongoose.model("Note", noteSchema);

// ===== API Routes =====

// Get all tasks for a date
app.get("/api/tasks/:date", async (req, res) => {
  const tasks = await Task.find({ date: req.params.date });
  res.json(tasks);
});

// Add a task
app.post("/api/tasks", async (req, res) => {
  const newTask = new Task(req.body);
  await newTask.save();
  res.json(newTask);
});

// Toggle or update a task
app.put("/api/tasks/:id", async (req, res) => {
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Task deleted" });
});

// ===== Notes Routes =====
app.get("/api/notes", async (req, res) => {
  const notes = await Note.find();
  res.json(notes);
});

app.post("/api/notes", async (req, res) => {
  const note = new Note(req.body);
  await note.save();
  res.json(note);
});

app.put("/api/notes/:id", async (req, res) => {
  const updated = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete("/api/notes/:id", async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.json({ message: "Note deleted" });
});

// ===== Serve Frontend (public folder) =====
app.use(express.static("public"));

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
