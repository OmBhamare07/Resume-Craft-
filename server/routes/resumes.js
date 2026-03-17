const express = require('express');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/authMiddleware');
const { getResumesByUser, getResumeById, saveResume, deleteResume } = require('../lib/dynamo');

const router = express.Router();

// GET /api/resumes — list all resumes for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const resumes = await getResumesByUser(req.user.userId);
    res.json({ resumes });
  } catch (err) {
    console.error('Get resumes error:', err);
    res.status(500).json({ error: 'Failed to load resumes' });
  }
});

// GET /api/resumes/:id — get single resume
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await getResumeById(req.params.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (resume.userId !== req.user.userId) return res.status(403).json({ error: 'Access denied' });
    res.json({ resume });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load resume' });
  }
});

// POST /api/resumes — create new resume
router.post('/', auth, async (req, res) => {
  try {
    const { templateId, resumeData, title } = req.body;
    const resume = {
      resumeId: uuidv4(),
      userId: req.user.userId,
      templateId: templateId || 'modern',
      title: title || 'Untitled Resume',
      resumeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveResume(resume);
    res.json({ resume });
  } catch (err) {
    console.error('Create resume error:', err);
    res.status(500).json({ error: 'Failed to save resume' });
  }
});

// PUT /api/resumes/:id — update resume (auto-save)
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await getResumeById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Resume not found' });
    if (existing.userId !== req.user.userId) return res.status(403).json({ error: 'Access denied' });

    const { templateId, resumeData, title } = req.body;
    const updated = {
      ...existing,
      templateId: templateId ?? existing.templateId,
      resumeData: resumeData ?? existing.resumeData,
      title: title ?? existing.title,
      updatedAt: new Date().toISOString(),
    };
    await saveResume(updated);
    res.json({ resume: updated });
  } catch (err) {
    console.error('Update resume error:', err);
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

// DELETE /api/resumes/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await getResumeById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Resume not found' });
    if (existing.userId !== req.user.userId) return res.status(403).json({ error: 'Access denied' });

    await deleteResume(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;
