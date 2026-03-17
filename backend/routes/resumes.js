const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../services/dynamodb");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// GET /api/resumes
router.get("/", async (req, res) => {
  try {
    const resumes = await db.getResumesByUser(req.user.userId);
    resumes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(resumes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/resumes
router.post("/", async (req, res) => {
  try {
    const { templateId, resumeData, name } = req.body;
    const resumeId = uuidv4();
    const now = new Date().toISOString();
    const resume = {
      userId: req.user.userId,
      resumeId,
      templateId,
      resumeData,
      name: name || "Untitled Resume",
      createdAt: now,
      updatedAt: now,
    };
    await db.saveResume(resume);
    res.json(resume);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/resumes/:resumeId
router.get("/:resumeId", async (req, res) => {
  try {
    const resume = await db.getResume(req.user.userId, req.params.resumeId);
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/resumes/:resumeId
router.put("/:resumeId", async (req, res) => {
  try {
    const { templateId, resumeData, name } = req.body;
    const updates = { updatedAt: new Date().toISOString() };
    if (templateId) updates.templateId = templateId;
    if (resumeData) updates.resumeData = resumeData;
    if (name) updates.name = name;
    await db.updateResume(req.user.userId, req.params.resumeId, updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/resumes/:resumeId
router.delete("/:resumeId", async (req, res) => {
  try {
    await db.deleteResume(req.user.userId, req.params.resumeId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
