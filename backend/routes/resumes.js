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

// POST /api/resumes/generate-pdf
router.post("/generate-pdf", async (req, res) => {
  try {
    const { templateId, resumeData, fontFamily, sectionOrder } = req.body;
    if (!templateId || !resumeData) {
      return res.status(400).json({ error: "templateId and resumeData required" });
    }
    const { generatePDF } = require("../services/pdfGenerator");
    const pdfBuffer = await generatePDF(templateId, resumeData, fontFamily || "Arial, sans-serif", sectionOrder);
    const name = resumeData?.personalInfo?.fullName || "Resume";
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name.replace(/\s+/g, "_")}_Resume.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: err.message || "PDF generation failed" });
  }
});

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
    if (score === undefined || score === null) return res.status(400).json({ error: "Score is required" });
    const resume = await db.getResume(req.user.userId, req.params.resumeId);
    if (!resume) {
      console.error(`Score save: resume not found for userId=${req.user.userId} resumeId=${req.params.resumeId}`);
      return res.status(404).json({ error: "Resume not found" });
    }
    const scores = Array.isArray(resume.atsScores) ? resume.atsScores : [];
    scores.push({ score: Number(score), jobRole: jobRole || 'General', date: new Date().toISOString() });
    const trimmed = scores.slice(-20);
    await db.updateResume(req.user.userId, req.params.resumeId, { atsScores: trimmed });
    console.log(`Score saved: ${score} for resumeId=${req.params.resumeId}`);
    res.json({ success: true, totalScores: trimmed.length });
  } catch (err) {
    console.error("Score save error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});


