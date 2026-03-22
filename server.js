require("dotenv").config();
const { runAgents } = require("./services/aiEngine");
const { calculateRisk } = require("./services/riskEngine");
const { benchmarkPrices } = require("./services/benchmark");
const { forecastDemand } = require("./services/forecasting");
const { simulateScenario } = require("./services/simulation");
const { classifySpend } = require("./services/classification");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const { OpenAI } = require("openai");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./database.db");

// Create table
db.run(`
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  price REAL,
  rating REAL
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT
)
`);

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Upload setup
const upload = multer({ dest: "uploads/" });

// Upload CSV
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ message: "File uploaded (parsing coming next version)" });
});

// Add supplier manually
app.post("/supplier", (req, res) => {
  const { name, price, rating } = req.body;

  db.run(
    `INSERT INTO suppliers (name, price, rating) VALUES (?, ?, ?)`,
    [name, price, rating],
    function (err) {
      if (err) return res.status(500).send(err);
      res.json({ id: this.lastID });
    }
  );
});

// Get suppliers
app.get("/suppliers", auth, (_, res) => {
  db.all("SELECT * FROM suppliers", [], (err, rows) => {
    res.json(rows);
  });
});

// AI analysis
app.post("/ai", async (req, res) => {
  const { question } = req.body;

  db.all("SELECT * FROM suppliers", [], async (_, rows) => {
    const prompt = `
You are a procurement expert.

Suppliers:
${JSON.stringify(rows)}

Question: ${question}
Answer clearly.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({
      answer: completion.choices[0].message.content,
    });
  });
});

app.post("/ai-advanced", async (req, res) => {
  const { question } = req.body;

  db.all("SELECT * FROM suppliers", [], async (_, rows) => {
    const result = await runAgents(rows, question);
    res.json({ result });
  });
});

app.get("/risk", auth, (_, res) => {
  db.all("SELECT * FROM suppliers", [], (err, rows) => {
    const risks = rows.map((s) => ({
      ...s,
      risk: calculateRisk(s),
    }));

    res.json(risks);
  });
});

app.get("/benchmark", auth, (_, res) => {
  db.all("SELECT * FROM suppliers", [], (err, rows) => {
    res.json(benchmarkPrices(rows));
  });
});

app.get("/forecast", auth, (req, res) => {
  const history = [100, 120, 130, 150];

  const result = forecastDemand(history);
  res.json({ forecast: result });
});

app.get("/simulate", auth, (_, res) => {
  db.all("SELECT * FROM suppliers", [], (err, rows) => {
    const simulated = simulateScenario(rows, 10);
    res.json(simulated);
  });
});

app.get("/classify", auth, (_, res) => {
  const { text } = req.query;

  const category = classifySpend(text);
  res.json({ category });
});

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = "supersecretkey";
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).send("No token");

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (email, password) VALUES (?, ?)`,
    [email, hashed],
    function (err) {
      if (err) return res.status(400).send("User exists");

      res.json({ message: "User created" });
    }
  );
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (_, user) => {
      if (!user) return res.status(400).send("User not found");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(400).send("Wrong password");

      const token = jwt.sign({ id: user.id }, SECRET);

      res.json({ token });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).send("No token");

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}