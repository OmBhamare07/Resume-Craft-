const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
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

    const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
    const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
    const docClient = DynamoDBDocumentClient.from(client);

    const result = await docClient.send(new ScanCommand({
      TableName: "resumecraft-users",
      FilterExpression: "verificationToken = :t",
      ExpressionAttributeValues: { ":t": token },
      Limit: 1,
    }));

    const user = result.Items?.[0];
    if (!user) return res.status(400).json({ error: "Invalid or expired verification link" });
    if (Date.now() > user.verificationExpiry)
      return res.status(400).json({ error: "Verification link has expired. Please sign up again." });

    await db.updateUser(user.userId, {
      isVerified: true,
      verificationToken: null,
      verificationExpiry: null,
    });

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
