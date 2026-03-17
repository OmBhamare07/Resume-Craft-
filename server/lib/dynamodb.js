const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const db = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'resumecraft-users';
const RESUMES_TABLE = process.env.DYNAMODB_RESUMES_TABLE || 'resumecraft-resumes';

// ── Users ──────────────────────────────────────────
async function getUserById(userId) {
  const res = await db.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId } }));
  return res.Item || null;
}

async function getUserByEmail(email) {
  const res = await db.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: 'emailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
    Limit: 1,
  }));
  return res.Items?.[0] || null;
}

async function getUserByVerificationToken(token) {
  const res = await db.send(new ScanCommand({
    TableName: USERS_TABLE,
    FilterExpression: 'verificationToken = :token',
    ExpressionAttributeValues: { ':token': token },
    Limit: 1,
  }));
  return res.Items?.[0] || null;
}

async function createUser(user) {
  await db.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));
  return user;
}

async function updateUser(userId, updates) {
  const keys = Object.keys(updates);
  const expr = 'SET ' + keys.map((k, i) => `#k${i} = :v${i}`).join(', ');
  const names = Object.fromEntries(keys.map((k, i) => [`#k${i}`, k]));
  const vals = Object.fromEntries(keys.map((k, i) => [`:v${i}`, updates[k]]));
  await db.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { userId },
    UpdateExpression: expr,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: vals,
  }));
}

// ── Resumes ────────────────────────────────────────
async function getResumesByUser(userId) {
  const res = await db.send(new QueryCommand({
    TableName: RESUMES_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));
  return (res.Items || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function getResume(userId, resumeId) {
  const res = await db.send(new GetCommand({ TableName: RESUMES_TABLE, Key: { userId, resumeId } }));
  return res.Item || null;
}

async function putResume(resume) {
  await db.send(new PutCommand({ TableName: RESUMES_TABLE, Item: resume }));
  return resume;
}

async function deleteResume(userId, resumeId) {
  await db.send(new DeleteCommand({ TableName: RESUMES_TABLE, Key: { userId, resumeId } }));
}

module.exports = { getUserById, getUserByEmail, getUserByVerificationToken, createUser, updateUser, getResumesByUser, getResume, putResume, deleteResume, USERS_TABLE, RESUMES_TABLE };
