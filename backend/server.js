require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resumes");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);

// Serve built frontend
const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

// SPA catch-all
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`ResumeCraft running on http://0.0.0.0:${PORT}`);
});
