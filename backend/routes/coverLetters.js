const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

const TABLE = "resumecraft-cover-letters";

function getDb() {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
  return DynamoDBDocumentClient.from(client);
}

router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const result = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": req.user.userId },
    }));
    const items = (result.Items || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const db = getDb();
    const { name, content, resumeId, jobTitle, company } = req.body;
    const letterId = uuidv4();
    const now = new Date().toISOString();
    const item = { userId: req.user.userId, letterId, name: name || "Untitled Cover Letter", content, resumeId, jobTitle, company, createdAt: now, updatedAt: now };
    await db.send(new PutCommand({ TableName: TABLE, Item: item }));
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:letterId", async (req, res) => {
  try {
    const db = getDb();
    const result = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: req.user.userId, letterId: req.params.letterId } }));
    if (!result.Item) return res.status(404).json({ error: "Not found" });
    res.json(result.Item);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:letterId", async (req, res) => {
  try {
    const db = getDb();
    const { name, content, jobTitle, company } = req.body;
    const now = new Date().toISOString();
    const item = { userId: req.user.userId, letterId: req.params.letterId, name, content, jobTitle, company, updatedAt: now };
    await db.send(new PutCommand({ TableName: TABLE, Item: item }));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:letterId", async (req, res) => {
  try {
    const db = getDb();
    await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId: req.user.userId, letterId: req.params.letterId } }));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
