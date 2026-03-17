const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient, PutCommand, GetCommand,
  QueryCommand, UpdateCommand, DeleteCommand, ScanCommand
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const db = DynamoDBDocumentClient.from(client);

const USERS_TABLE = "resumecraft-users";
const RESUMES_TABLE = "resumecraft-resumes";

function buildUpdate(updates) {
  const keys = Object.keys(updates);
  const expr = keys.map((k, i) => `#k${i} = :v${i}`).join(", ");
  const names = Object.fromEntries(keys.map((k, i) => [`#k${i}`, k]));
  const values = Object.fromEntries(keys.map((k, i) => [`:v${i}`, updates[k]]));
  return { expr, names, values };
}

async function createUser(user) {
  await db.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));
}

async function getUserById(userId) {
  const res = await db.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId } }));
  return res.Item || null;
}

async function getUserByEmail(email) {
  const res = await db.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: "EmailIndex",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: { ":email": email },
    Limit: 1,
  }));
  return res.Items?.[0] || null;
}

async function updateUser(userId, updates) {
  const { expr, names, values } = buildUpdate(updates);
  await db.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { userId },
    UpdateExpression: `SET ${expr}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

async function saveResume(resume) {
  await db.send(new PutCommand({ TableName: RESUMES_TABLE, Item: resume }));
}

async function getResumesByUser(userId) {
  const res = await db.send(new QueryCommand({
    TableName: RESUMES_TABLE,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
  }));
  return res.Items || [];
}

async function getResume(userId, resumeId) {
  const res = await db.send(new GetCommand({
    TableName: RESUMES_TABLE,
    Key: { userId, resumeId },
  }));
  return res.Item || null;
}

async function updateResume(userId, resumeId, updates) {
  const { expr, names, values } = buildUpdate(updates);
  await db.send(new UpdateCommand({
    TableName: RESUMES_TABLE,
    Key: { userId, resumeId },
    UpdateExpression: `SET ${expr}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

async function deleteResume(userId, resumeId) {
  await db.send(new DeleteCommand({ TableName: RESUMES_TABLE, Key: { userId, resumeId } }));
}

module.exports = {
  createUser, getUserById, getUserByEmail, updateUser,
  saveResume, getResumesByUser, getResume, updateResume, deleteResume,
};
