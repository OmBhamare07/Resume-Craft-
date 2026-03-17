# ResumeCraft — Setup Guide

## Architecture
- **Frontend**: React + Vite (built to `dist/`)
- **Backend**: Express.js (serves API + static frontend on port 3000)
- **Database**: AWS DynamoDB (users + resumes)
- **Auth**: JWT + Google OAuth + Email verification via Gmail

---

## Step 1 — EC2 IAM Role
Your EC2 needs permission to access DynamoDB.
1. Go to **EC2 → Actions → Security → Modify IAM Role**
2. Attach (or create) a role with **AmazonDynamoDBFullAccess**

---

## Step 2 — Upload project to EC2
```bash
# From your local machine:
scp -r Resume-Craft-master ec2-user@YOUR_EC2_IP:~/
# or use FileZilla / VS Code Remote SSH
```

---

## Step 3 — Configure backend environment
```bash
cd ~/Resume-Craft-master/backend
cp .env.example .env
nano .env
```

Fill in all values:
```
PORT=3000
FRONTEND_URL=http://YOUR_EC2_IP:3000
AWS_REGION=us-east-1
JWT_SECRET=any-long-random-string-32+-chars
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### Getting GMAIL_APP_PASSWORD:
1. Enable 2FA on your Google account
2. Go to myaccount.google.com/apppasswords
3. Create app password → copy the 16-char code

### Getting GOOGLE_CLIENT_ID:
1. Go to console.cloud.google.com
2. Create project → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Add `http://YOUR_EC2_IP:3000` to Authorized JavaScript Origins
4. Copy the Client ID

---

## Step 4 — Configure frontend environment
```bash
cd ~/Resume-Craft-master
nano .env
```
```
VITE_GEMINI_API_KEY=your_gemini_key
VITE_GOOGLE_CLIENT_ID=same-client-id-as-backend
```

---

## Step 5 — Run setup (only once)
```bash
cd ~/Resume-Craft-master
bash setup-autostart.sh
```
This creates DynamoDB tables, builds the app, and sets up auto-start on reboot.

---

## Step 6 — Open EC2 Security Group port
AWS Console → EC2 → Security Groups → Inbound Rules → Add:
- **Type**: Custom TCP
- **Port**: 3000
- **Source**: 0.0.0.0/0

---

## Updating the app (after any code/env change)
```bash
cd ~/Resume-Craft-master
bash deploy.sh
```

---

## Useful Commands
```bash
sudo systemctl status resumecraft    # Is it running?
sudo systemctl restart resumecraft   # Restart after env changes
sudo journalctl -u resumecraft -f    # Live logs
```
