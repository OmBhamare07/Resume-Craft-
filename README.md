# ResumeCraft

ATS Resume Builder with login, resume history, AI chatbot, and ATS checker.

## Stack
- **Frontend**: React + Vite + Tailwind
- **Backend**: Express.js + SQLite (runs on same EC2 — no extra DB cost)
- **Auth**: JWT (30-day tokens)

---

## Local Development

You need TWO terminals:

**Terminal 1 — API server (port 3001):**
```bash
npm install
node server/index.js
```

**Terminal 2 — Vite frontend (port 8080):**
```bash
npm run dev
```

Then open `http://localhost:8080`

Or run both at once:
```bash
npm run dev:full
```

---

## EC2 Deployment (one-time setup)

```bash
# SSH into EC2, upload project, then:
bash setup-autostart.sh
```

Open port 3000 in your EC2 Security Group (Inbound: Custom TCP, Port 3000, 0.0.0.0/0).

**After any code changes:**
```bash
bash deploy.sh
```

---

## Environment Variables

Create a `.env` file (already included):
```
VITE_GEMINI_API_KEY=your_gemini_key   # For AI chatbot
JWT_SECRET=your-long-random-secret    # Optional, has default
PORT=3000                             # Optional, default 3000 prod / 3001 dev
```
