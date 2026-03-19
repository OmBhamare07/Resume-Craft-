require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resumes");
const coverLetterRoutes = require("./routes/coverLetters");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/cover-letters", coverLetterRoutes);


// Public shared resume endpoint (no auth)
app.get("/api/shared/:shareToken", async (req, res) => {
  try {
    const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
    const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
    const db = DynamoDBDocumentClient.from(client);
    const result = await db.send(new ScanCommand({
      TableName: "resumecraft-resumes",
      FilterExpression: "shareToken = :t AND shareEnabled = :e",
      ExpressionAttributeValues: { ":t": req.params.shareToken, ":e": true },
      Limit: 1,
    }));
    const resume = result.Items?.[0];
    if (!resume) return res.status(404).json({ error: "Resume not found or sharing disabled" });
    res.json({ resumeData: resume.resumeData, templateId: resume.templateId, name: resume.name });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

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
