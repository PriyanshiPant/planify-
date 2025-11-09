const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const { WebAppStrategy } = require("ibmcloud-appid");

dotenv.config();

console.log("MONGO_URI:", process.env.MONGO_URI);

// Determine environment (local or deployed)
const isLocal = process.env.NODE_ENV !== "production";
console.log(isLocal ? "Running in LOCAL mode" : "Running in PRODUCTION mode");

const app = express();
app.use(express.json());
app.use(cors());

// ===== MongoDB Connection =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ===== IBM App ID Setup =====
const redirectUri = isLocal
  ? "http://localhost:5000/callback"
  : "https://planifyplus-ftet.onrender.com/callback";

console.log("Redirect URI:", redirectUri);

app.use(
  session({
    secret: "planify_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new WebAppStrategy({
    tenantId: process.env.APPID_TENANT_ID,
    clientId: process.env.APPID_CLIENT_ID,
    secret: process.env.APPID_SECRET,
    oauthServerUrl: process.env.APPID_OAUTH_SERVER_URL,
    redirectUri,
  })
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ===== Auth Routes =====

// Login route - redirects to IBM login
app.get(
  "/login",
  passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
    successRedirect: "/",
    forceLogin: true,
  })
);

// Callback route - returns from IBM App ID
app.get(
  "/callback",
  passport.authenticate(WebAppStrategy.STRATEGY_NAME),
  (req, res) => {
    res.redirect("/");
  }
);

// Logout route
app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

// Middleware to protect private routes
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
};

// ===== Mongoose Schemas =====
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

// ===== Protected API Routes =====
app.get("/api/tasks/:date", ensureAuthenticated, async (req, res) => {
  const tasks = await Task.find({ date: req.params.date });
  res.json(tasks);
});

app.post("/api/tasks", ensureAuthenticated, async (req, res) => {
  const newTask = new Task(req.body);
  await newTask.save();
  res.json(newTask);
});

app.put("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Task deleted" });
});

app.get("/api/notes", ensureAuthenticated, async (req, res) => {
  const notes = await Note.find();
  res.json(notes);
});

app.post("/api/notes", ensureAuthenticated, async (req, res) => {
  const note = new Note(req.body);
  await note.save();
  res.json(note);
});

app.put("/api/notes/:id", ensureAuthenticated, async (req, res) => {
  const updated = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete("/api/notes/:id", ensureAuthenticated, async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.json({ message: "Note deleted" });
});

// ===== Serve Frontend =====
app.use(express.static(__dirname));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
