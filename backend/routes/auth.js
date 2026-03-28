const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const db = require("../services/dynamodb");
const { sendVerificationEmail } = require("../services/email");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { userId: user.userId, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function getDynamoClient() {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
  return DynamoDBDocumentClient.from(client);
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = await db.getUserByEmail(email.toLowerCase());
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();
    const verificationExpiry = Date.now() + 24 * 60 * 60 * 1000;
    const userId = uuidv4();

    await db.createUser({
      userId,
      email: email.toLowerCase(),
      name,
      passwordHash,
      isVerified: false,
      verificationToken,
      verificationExpiry,
      createdAt: new Date().toISOString(),
    });

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    await sendVerificationEmail(email, name, verificationToken, baseUrl);

    res.json({ message: "Account created! Please check your email to verify your account." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await db.getUserByEmail(email.toLowerCase());
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    if (!user.isVerified) return res.status(403).json({ error: "Please verify your email before logging in. Check your inbox." });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken(user);
    res.json({ token, user: { userId: user.userId, email: user.email, name: user.name } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/auth/verify-email?token=xxx
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token required" });

    const docClient = getDynamoClient();

    // Scan for user with this verification token
    const result = await docClient.send(new ScanCommand({
      TableName: "resumecraft-users",
      FilterExpression: "verificationToken = :t",
      ExpressionAttributeValues: { ":t": token },
    }));

    console.log("Verify scan result count:", result.Items?.length);

    const user = result.Items?.[0];
    if (!user) {
      console.log("No user found with token:", token);
      return res.status(400).json({ error: "Invalid or expired verification link" });
    }

    if (Date.now() > user.verificationExpiry) {
      console.log("Token expired for user:", user.email);
      return res.status(400).json({ error: "Verification link has expired. Please sign up again." });
    }

    // Mark user as verified
    await docClient.send(new UpdateCommand({
      TableName: "resumecraft-users",
      Key: { userId: user.userId },
      UpdateExpression: "SET isVerified = :v REMOVE verificationToken, verificationExpiry",
      ExpressionAttributeValues: {
        ":v": true,
      },
    }));

    console.log("User verified successfully:", user.email);
    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ userId: user.userId, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

// POST /api/auth/forgot-password — send reset link
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const db = getDynamoClient();
    const result = await db.send(new ScanCommand({
      TableName: "resumecraft-users",
      FilterExpression: "email = :e",
      ExpressionAttributeValues: { ":e": email },
      Limit: 1,
    }));
    const user = result.Items?.[0];
    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true });

    const resetToken = require("crypto").randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await db.send(new UpdateCommand({
      TableName: "resumecraft-users",
      Key: { userId: user.userId },
      UpdateExpression: "SET resetToken = :t, resetExpiry = :e",
      ExpressionAttributeValues: { ":t": resetToken, ":e": resetExpiry },
    }));

    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "ResumeCraft — Password Reset",
      html: `
        <h2>Reset Your Password</h2>
        <p>Hi ${user.name},</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${appUrl}/reset-password?token=${resetToken}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
        <p style="color:#666;font-size:12px;margin-top:16px;">If you didn't request this, ignore this email.</p>
      `,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

// POST /api/auth/reset-password — reset with token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and password are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const db = getDynamoClient();
    const result = await db.send(new ScanCommand({
      TableName: "resumecraft-users",
      FilterExpression: "resetToken = :t",
      ExpressionAttributeValues: { ":t": token },
      Limit: 1,
    }));
    const user = result.Items?.[0];
    if (!user) return res.status(400).json({ error: "Invalid or expired reset link" });
    if (new Date(user.resetExpiry) < new Date()) return res.status(400).json({ error: "Reset link has expired. Please request a new one." });

    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 10);
    await db.send(new UpdateCommand({
      TableName: "resumecraft-users",
      Key: { userId: user.userId },
      UpdateExpression: "SET passwordHash = :p REMOVE resetToken, resetExpiry",
      ExpressionAttributeValues: { ":p": passwordHash },
    }));
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});
