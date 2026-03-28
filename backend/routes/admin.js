const express = require("express");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const authMiddleware = require("../middleware/auth");
const nodemailer = require("nodemailer");

const router = express.Router();
router.use(authMiddleware);

function getDb() {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
  return DynamoDBDocumentClient.from(client);
}

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const db = getDb();
    const result = await db.send(new GetCommand({
      TableName: "resumecraft-users",
      Key: { userId: req.user.userId },
    }));
    if (!result.Item || result.Item.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/admin/stats — get all users with resume/cover letter counts
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const db = getDb();

    // Get all users
    const usersResult = await db.send(new ScanCommand({ TableName: "resumecraft-users" }));
    const users = usersResult.Items || [];

    // Get resume counts per user
    const resumesResult = await db.send(new ScanCommand({
      TableName: "resumecraft-resumes",
      ProjectionExpression: "userId, resumeId, #n, createdAt",
      ExpressionAttributeNames: { "#n": "name" },
    }));
    const resumes = resumesResult.Items || [];

    // Get cover letter counts per user
    const lettersResult = await db.send(new ScanCommand({
      TableName: "resumecraft-cover-letters",
      ProjectionExpression: "userId, letterId",
    }));
    const letters = lettersResult.Items || [];

    // Build stats per user
    const stats = users.map(u => ({
      userId: u.userId,
      name: u.name,
      email: u.email,
      role: u.role || "user",
      adminStatus: u.adminStatus || null,
      verified: u.verified || false,
      createdAt: u.createdAt || null,
      resumeCount: resumes.filter(r => r.userId === u.userId).length,
      coverLetterCount: letters.filter(l => l.userId === u.userId).length,
    }));

    res.json({
      totalUsers: users.length,
      totalResumes: resumes.length,
      totalCoverLetters: letters.length,
      users: stats.sort((a, b) => (b.resumeCount + b.coverLetterCount) - (a.resumeCount + a.coverLetterCount)),
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:userId/grant — grant admin access
router.put("/users/:userId/grant", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    await db.send(new UpdateCommand({
      TableName: "resumecraft-users",
      Key: { userId: req.params.userId },
      UpdateExpression: "SET #role = :role, adminStatus = :status",
      ExpressionAttributeNames: { "#role": "role" },
      ExpressionAttributeValues: { ":role": "admin", ":status": "approved" },
    }));

    // Send approval email
    const userResult = await db.send(new GetCommand({
      TableName: "resumecraft-users",
      Key: { userId: req.params.userId },
    }));
    const user = userResult.Item;
    if (user?.email) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        });
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: user.email,
          subject: "ResumeCraft — Admin Access Granted",
          html: `<h2>Admin Access Granted</h2><p>Hi ${user.name},</p><p>Your admin access to ResumeCraft has been approved. You can now access the admin dashboard.</p>`,
        });
      } catch {}
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:userId/revoke — revoke admin access
router.put("/users/:userId/revoke", requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    await db.send(new UpdateCommand({
      TableName: "resumecraft-users",
      Key: { userId: req.params.userId },
      UpdateExpression: "SET #role = :role, adminStatus = :status",
      ExpressionAttributeNames: { "#role": "role" },
      ExpressionAttributeValues: { ":role": "user", ":status": "revoked" },
    }));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, requireAdmin };
