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

// PUT /api/resumes/:resumeId/share — generate share token
router.put("/:resumeId/share", async (req, res) => {
  try {
    const { v4: uuidv4 } = require("uuid");
    const shareToken = uuidv4();
    await db.updateResume(req.user.userId, req.params.resumeId, {
      shareToken,
      shareEnabled: true,
    });
    res.json({ shareToken, shareUrl: `${process.env.FRONTEND_URL || ''}/shared/${shareToken}` });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/resumes/:resumeId/unshare
router.put("/:resumeId/unshare", async (req, res) => {
  try {
    await db.updateResume(req.user.userId, req.params.resumeId, {
      shareToken: null,
      shareEnabled: false,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/resumes/:resumeId/scores — save ATS score history
router.put("/:resumeId/scores", async (req, res) => {
  try {
    const { score, jobRole } = req.body;
    const resume = await db.getResume(req.user.userId, req.params.resumeId);
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    const scores = resume.atsScores || [];
    scores.push({ score, jobRole, date: new Date().toISOString() });
    // Keep last 20 scores
    const trimmed = scores.slice(-20);
    await db.updateResume(req.user.userId, req.params.resumeId, { atsScores: trimmed });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
