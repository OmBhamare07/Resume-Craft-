require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resumes");
const coverLetterRoutes = require("./routes/coverLetters");
const { router: adminRoutes } = require("./routes/admin");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/cover-letters", coverLetterRoutes);
app.use("/api/admin", adminRoutes);


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


// Multi-source job search — Adzuna + Remotive + The Muse
app.get("/api/jobs/search", async (req, res) => {
  const { keywords, location, page = 1 } = req.query;
  const kw = keywords || "software engineer";
  const loc = location || "India";
  const allJobs = [];
  const errors = [];

  // ── Source 1: Adzuna (India) ───────────────────────────────────────
  try {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (appId && appKey) {
      const url = `https://api.adzuna.com/v1/api/jobs/in/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=${encodeURIComponent(kw)}&where=${encodeURIComponent(loc)}&max_days_old=7&sort_by=date&content-type=application/json`;
      const r = await fetch(url);
      if (r.ok) {
        const data = await r.json();
        (data.results || []).forEach(job => allJobs.push({
          id: "az_" + job.id,
          title: job.title,
          company: job.company?.display_name || "Unknown",
          location: job.location?.display_name || loc,
          description: job.description || "",
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          created: job.created,
          redirect_url: job.redirect_url,
          category: job.category?.label || "",
          source: "Adzuna"
        }));
      }
    }
  } catch (e) { errors.push("Adzuna: " + e.message); }

  // ── Source 2: Remotive (Remote jobs worldwide, no auth needed) ──────
  try {
    const remotiveUrl = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(kw)}&limit=8`;
    const r = await fetch(remotiveUrl);
    if (r.ok) {
      const data = await r.json();
      (data.jobs || []).forEach(job => {
        const created = job.publication_date || new Date().toISOString();
        const daysOld = (Date.now() - new Date(created).getTime()) / 86400000;
        if (daysOld <= 7) {
          allJobs.push({
            id: "rm_" + job.id,
            title: job.title,
            company: job.company_name || "Unknown",
            location: job.candidate_required_location || "Remote",
            description: job.description ? job.description.replace(/<[^>]+>/g, '').substring(0, 300) : "",
            salary_min: null,
            salary_max: null,
            created: created,
            redirect_url: job.url,
            category: job.category || "",
            source: "Remotive (Remote)"
          });
        }
      });
    }
  } catch (e) { errors.push("Remotive: " + e.message); }

  // ── Source 3: The Muse (Global, no auth needed) ─────────────────────
  try {
    const museUrl = `https://www.themuse.com/api/public/jobs?category=${encodeURIComponent(kw)}&page=1&descending=true`;
    const r = await fetch(museUrl, { headers: { "User-Agent": "ResumeCraft/1.0" } });
    if (r.ok) {
      const data = await r.json();
      (data.results || []).slice(0, 6).forEach(job => {
        const created = job.publication_date || new Date().toISOString();
        const daysOld = (Date.now() - new Date(created).getTime()) / 86400000;
        if (daysOld <= 7) {
          allJobs.push({
            id: "mu_" + job.id,
            title: job.name,
            company: job.company?.name || "Unknown",
            location: job.locations?.map(l => l.name).join(", ") || "Various",
            description: job.contents ? job.contents.replace(/<[^>]+>/g, '').substring(0, 300) : "",
            salary_min: null,
            salary_max: null,
            created: created,
            redirect_url: job.refs?.landing_page || "",
            category: job.categories?.map(c => c.name).join(", ") || "",
            source: "The Muse"
          });
        }
      });
    }
  } catch (e) { errors.push("TheMuse: " + e.message); }

  // Sort all jobs by date (newest first) and deduplicate by title+company
  const seen = new Set();
  const unique = allJobs
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .filter(job => {
      const key = (job.title + job.company).toLowerCase().replace(/\s/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (unique.length === 0) {
    console.error("All job sources failed:", errors);
    return res.status(503).json({ error: "No jobs found. Try different keywords.", errors });
  }

  res.json({ results: unique, total_count: unique.length, sources: [...new Set(unique.map(j => j.source))] });
});


// POST /api/admin/request — user requests admin access, sends email to super admin
app.post("/api/admin/request", async (req, res) => {
  try {
    const { userId, name, email } = req.body;
    if (!userId || !email) return res.status(400).json({ error: "Missing fields" });

    const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
    const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
    const db = DynamoDBDocumentClient.from(client);

    // Mark user as pending admin
    await db.send(new UpdateCommand({
      TableName: "resumecraft-users",
      Key: { userId },
      UpdateExpression: "SET adminStatus = :s",
      ExpressionAttributeValues: { ":s": "pending" },
    }));

    // Send email to super admin
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "ombhamare178@gmail.com",
      subject: `ResumeCraft — Admin Access Request from ${name}`,
      html: `
        <h2>New Admin Access Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <br/>
        <p>To grant admin access, go to the admin dashboard and approve this user.</p>
        <p><a href="${appUrl}/admin" style="background:#7c3aed;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">Open Admin Dashboard</a></p>
      `,
    });

    res.json({ success: true, message: "Request sent. You will be notified when approved." });
  } catch (err) {
    console.error("Admin request error:", err);
    res.status(500).json({ error: err.message || "Request failed" });
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
