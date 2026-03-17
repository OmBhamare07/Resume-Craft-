const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { getUserByEmail, getUserByGoogleId, createUser, updateUser } = require('../lib/dynamo');
const { sendVerificationEmail } = require('../lib/ses');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { userId: user.userId, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Google OAuth Setup
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await getUserByGoogleId(profile.id);
      if (user) return done(null, user);

      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await getUserByEmail(email);
        if (user) {
          await updateUser(user.userId, { googleId: profile.id, verified: true });
          return done(null, { ...user, googleId: profile.id, verified: true });
        }
      }

      const newUser = {
        userId: uuidv4(),
        name: profile.displayName,
        email: email || '',
        googleId: profile.id,
        verified: true,
        createdAt: new Date().toISOString(),
      };
      await createUser(newUser);
      return done(null, newUser);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = uuidv4();
    const user = {
      userId: uuidv4(),
      name,
      email,
      passwordHash,
      verified: false,
      verificationToken,
      verificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    await createUser(user);
    await sendVerificationEmail(email, name, verificationToken);
    res.json({ message: 'Account created! Please check your email to verify your account.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await getUserByEmail(email);
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.verified) return res.status(403).json({ error: 'Please verify your email before logging in.' });

    const token = signToken(user);
    res.json({ token, user: { userId: user.userId, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/verify-email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_token`);

    const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    const result = await docClient.send(new ScanCommand({
      TableName: 'resumecraft-users',
      FilterExpression: 'verificationToken = :token',
      ExpressionAttributeValues: { ':token': token },
    }));

    const user = result.Items?.[0];
    if (!user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_token`);
    if (new Date(user.verificationExpiry) < new Date()) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_expired`);
    }

    await updateUser(user.userId, { verified: true, verificationToken: null, verificationExpiry: null });
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (err) {
    console.error('Verify error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
});

// GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { session: true, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
  (req, res) => {
    const token = signToken(req.user);
    const u = req.user;
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&name=${encodeURIComponent(u.name)}&email=${encodeURIComponent(u.email)}&userId=${u.userId}`);
  }
);

// GET /api/auth/me
router.get('/me', require('../middleware/authMiddleware'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
