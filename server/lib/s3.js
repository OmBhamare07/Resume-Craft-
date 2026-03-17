const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET = process.env.S3_RESUMES_BUCKET || 'resumecraft-resumes-data';

async function saveResumeData(userId, resumeId, data) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `users/${userId}/resumes/${resumeId}.json`,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
  }));
  return `users/${userId}/resumes/${resumeId}.json`;
}

async function getResumeData(s3Key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }));
  const str = await res.Body.transformToString();
  return JSON.parse(str);
}

async function deleteResumeData(s3Key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
}

module.exports = { saveResumeData, getResumeData, deleteResumeData, BUCKET };
