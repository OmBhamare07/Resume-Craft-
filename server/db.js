const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const db = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'resumecraft-users';
const RESUMES_TABLE = 'resumecraft-resumes';

// ── Users ──────────────────────────────────────────────

async function createUser(user) {
  await db.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));
  return user;
}

async function getUserById(userId) {
  const res = await db.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId } }));
  return res.Item || null;
}

async function getUserByEmail(email) {
  const res = await db.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': email },
    Limit: 1,
  }));
  return res.Items?.[0] || null;
}

async function getUserByGoogleId(googleId) {
  const res = await db.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: 'googleId-index',
    KeyConditionExpression: 'googleId = :g',
    ExpressionAttributeValues: { ':g': googleId },
    Limit: 1,
  }));
  return res.Items?.[0] || null;
}

async function updateUser(userId, fields) {
  const keys = Object.keys(fields);
  const expr = 'SET ' + keys.map((k, i) => `#k${i} = :v${i}`).join(', ');
  const names = Object.fromEntries(keys.map((k, i) => [`#k${i}`, k]));
  const values = Object.fromEntries(keys.map((k, i) => [`:v${i}`, fields[k]]));
  await db.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { userId },
    UpdateExpression: expr,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

// ── Resumes ────────────────────────────────────────────

async function saveResume(resume) {
  await db.send(new PutCommand({ TableName: RESUMES_TABLE, Item: resume }));
  return resume;
}

async function getResume(userId, resumeId) {
  const res = await db.send(new GetCommand({ TableName: RESUMES_TABLE, Key: { userId, resumeId } }));
  return res.Item || null;
}

async function listResumes(userId) {
  const res = await db.send(new QueryCommand({
    TableName: RESUMES_TABLE,
    KeyConditionExpression: 'userId = :u',
    ExpressionAttributeValues: { ':u': userId },
  }));
  return (res.Items || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function deleteResume(userId, resumeId) {
  await db.send(new DeleteCommand({ TableName: RESUMES_TABLE, Key: { userId, resumeId } }));
}

module.exports = { createUser, getUserById, getUserByEmail, getUserByGoogleId, updateUser, saveResume, getResume, listResumes, deleteResume };
