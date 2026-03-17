const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLES = {
  USERS: 'resumecraft-users',
  RESUMES: 'resumecraft-resumes',
};

// ── Users ──────────────────────────────────────────────────────

async function getUserById(userId) {
  const res = await dynamo.send(new GetCommand({ TableName: TABLES.USERS, Key: { userId } }));
  return res.Item || null;
}

async function getUserByEmail(email) {
  const res = await dynamo.send(new QueryCommand({
    TableName: TABLES.USERS,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
    Limit: 1,
  }));
  return res.Items?.[0] || null;
}

async function getUserByGoogleId(googleId) {
  const res = await dynamo.send(new QueryCommand({
    TableName: TABLES.USERS,
    IndexName: 'googleId-index',
    KeyConditionExpression: 'googleId = :gid',
    ExpressionAttributeValues: { ':gid': googleId },
    Limit: 1,
  }));
  return res.Items?.[0] || null;
}

async function createUser(user) {
  await dynamo.send(new PutCommand({ TableName: TABLES.USERS, Item: user }));
  return user;
}

async function updateUser(userId, updates) {
  const keys = Object.keys(updates);
  const expr = 'SET ' + keys.map((k, i) => `#k${i} = :v${i}`).join(', ');
  const names = Object.fromEntries(keys.map((k, i) => [`#k${i}`, k]));
  const vals = Object.fromEntries(keys.map((k, i) => [`:v${i}`, updates[k]]));
  await dynamo.send(new UpdateCommand({
    TableName: TABLES.USERS,
    Key: { userId },
    UpdateExpression: expr,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: vals,
  }));
}

// ── Resumes ────────────────────────────────────────────────────

async function getResumesByUser(userId) {
  const res = await dynamo.send(new QueryCommand({
    TableName: TABLES.RESUMES,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));
  return (res.Items || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function getResumeById(resumeId) {
  const res = await dynamo.send(new GetCommand({ TableName: TABLES.RESUMES, Key: { resumeId } }));
  return res.Item || null;
}

async function saveResume(resume) {
  await dynamo.send(new PutCommand({ TableName: TABLES.RESUMES, Item: resume }));
  return resume;
}

async function deleteResume(resumeId) {
  await dynamo.send(new DeleteCommand({ TableName: TABLES.RESUMES, Key: { resumeId } }));
}

module.exports = { getUserById, getUserByEmail, getUserByGoogleId, createUser, updateUser, getResumesByUser, getResumeById, saveResume, deleteResume, TABLES };
