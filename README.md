# ApexExam — Full-Stack Online Examination System

ApexExam is a production-ready, dark-themed Online Examination System built with Node.js, Express, React, and Tailwind CSS. It delivers role-based portals for Teachers and Candidates (Students), strictly MCQ-based exam authoring, distraction-free test delivery with server-side timer enforcement, automated grading, unique exam access keys, and deep analytics including a ranked **"Most Difficult Questions"** diagnostic engine.

**Zero Database Setup Required:** The platform runs with self-contained, atomic JSON file persistence (`data/store.json`) with in-memory caching. You do **not** need to install MongoDB, Docker, or configure cloud databases. Everything works out of the box with persistent storage across restarts and pre-seeded demo data.

---

## 1. Quick Start (Run Locally in 60 Seconds)

### Prerequisites
- Node.js 18+ installed on your computer.

### Steps
1. Clone or download the repository.
2. In your terminal, navigate to the project directory:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm run dev
   ```
4. Open your browser and visit:
   ```
   http://localhost:3000
   ```
   *Both the Node.js Express backend and Vite React frontend run simultaneously on port 3000.*

---

## 2. Seeded Demo Accounts & Credentials

The system comes pre-seeded with complete data (exams, questions, and realistic student attempts):

| Role | Email | Password | Name |
| :--- | :--- | :--- | :--- |
| **Teacher** | `teacher@apexexam.io` | `TeacherPass123!` | Dr. Eleanor Vance |
| **Candidate** | `student@apexexam.io` | `StudentPass123!` | Alex Chen |
| **Candidate** | `sarah.j@apexexam.io` | `StudentPass123!` | Sarah Jenkins |
| **Candidate** | `marcus.k@apexexam.io` | `StudentPass123!` | Marcus King |
| **Candidate** | `priya.p@apexexam.io` | `StudentPass123!` | Priya Patel |

*Tip: You can use the **1-Click Demo Login** buttons on the login page or top bar to toggle between Teacher and Student accounts instantly without typing.*

---

## 3. Pre-Seeded Unique Exam Access Keys

Teachers can generate custom or randomized unique keys for every exam. Students can enter the key on their dashboard to immediately unlock and attempt the exam.

| Exam Title | Subject | Unique Access Key | Duration | Questions |
| :--- | :--- | :--- | :--- | :--- |
| **Distributed Systems & Cloud Architecture** | Computer Science | `CLOUD-2026` | 45 mins | 5 Questions |
| **Advanced Data Structures & Complexity** | Algorithms | `ALGO-500` | 60 mins | 5 Questions |

---

## 4. Free 1-Click Deployment (Render Free Web Service)

You can deploy the entire application (Backend + Frontend + Persistent JSON Store) on **Render for 100% free** without setting up any database.

### Step-by-Step Render Deployment Guide
1. Push this repository to your GitHub or GitLab account.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3. Connect your repository.
4. Fill in the deployment settings:
   - **Name**: `apex-exam-system` (or your choice)
   - **Environment**: `Node`
   - **Region**: Closest to you (e.g. Oregon, Frankfurt)
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: Select **Free** ($0/month).
5. Add Environment Variables (click *Add Environment Variable*):
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `JWT_SECRET` = any random string (e.g. `apex_secret_key_prod_2026_exam_super`)
6. Click **Deploy Web Service**.
7. In ~2 minutes, your live URL will be active (e.g. `https://apex-exam-system.onrender.com`).

---

## 5. Key System Features

### Frictionless Role-Based Authentication
- **Two Roles**: Teacher and Candidate.
- **Open Registration**: Students and teachers can register directly with name, email, and password. No verification emails or secret keys required.
- **Persistent Sessions**: JWT stored in secure HTTP-only cookies with Bearer token fallback.
- **1-Click Role Switcher**: Instant switching for live demonstrations.

### Teacher Analytics Dashboard
- **7 Live Metric Cards**: Total Students, Exams Created, Total Attempts, Overall Average Marks, Highest Score, Lowest Score, Average Pass Rate.
- **4 Recharts Visualizations**:
  - Average Marks Across Exams
  - Cohort Score Distribution (0–20%, 21–40%, 41–60%, 61–80%, 81–100%)
  - Overall Pass vs Fail Percentage
  - Exam-Wise Student Outcomes (Comparative Stacked Bars)
- **"Most Difficult Questions" Diagnostic Engine**:
  - Automatically identifies and ranks questions by student failure percentage.
  - Displays Question text, Exam name, Total attempts, Incorrect response count, Failure percentage progress bar, and Correct answer key.
  - Calculated from real student attempt data in the store.

### Exam Management & Strict MCQ Authoring
- Create, edit, delete, publish/unpublish exams.
- Set title, description, subject, duration in minutes, total marks, and passing percentage.
- **Unique Access Key**: Set a custom key or auto-generate keys.
- **"All Unique Exam Access Keys" Overview**: Faculty directory allowing 1-click copying of exam access keys for distribution to students.
- **Strict MCQ Rules**: 2 to 4 options (A, B, C, D) per question, single correct radio selection, customizable question marks, and explanations.
- Reorder questions with up/down arrows.

### Candidate Examination Workspace
- **Distraction-Free Workspace**: Dark, focused test environment with sticky header.
- **Server-Synchronized Timer**: Automatic countdown with auto-submission when time expires.
- **Question Navigation Matrix**:
  - *Answered* (Purple)
  - *Visited Unanswered* (Amber)
  - *Not Visited* (Dark)
  - *Current Question* (Ring Highlight)
- **Zero-Answer-Leakage**: Correct answers and explanations are stripped from client payloads during the exam.
- **Autosave & Resume**: Periodic background saving preserves answers; refreshing the browser safely restores the in-progress exam.
- **Pre-Submission Confirmation**: Summary modal detailing answered vs unanswered questions before final submission.

### Automated Evaluation & Detailed Results
- Server-authoritative instant grading against database answer keys.
- Summary scorecard with marks obtained, percentage, pass/fail status, and duration taken.
- Question-by-question review with Green (Correct), Red (Incorrect), and Neutral (Unanswered) tags, candidate's answer, correct answer, and instructor explanation.

---

## 6. Architecture & File Structure

```
├── data/
│   └── store.json              # Local JSON store (users, exams, attempts)
├── server/
│   ├── config/
│   │   └── db.ts               # Database connector (calls jsonStore)
│   ├── controllers/
│   │   ├── authController.ts   # Open signup, login, session endpoints
│   │   ├── candidateController.ts # Exam unlock by key, start, save, submit, results
│   │   └── teacherController.ts   # Analytics, stats, difficult questions, exam CRUD
│   ├── middleware/
│   │   └── auth.ts             # JWT authentication & role-based authorization
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── candidateRoutes.ts
│   │   └── teacherRoutes.ts
│   └── services/
│       ├── jsonFileStore.ts    # JSON persistence engine with in-memory map cache
│       └── dataService.ts      # Unified data access layer
├── src/
│   ├── components/
│   │   ├── common/             # StatCard, Badge, Button, Input
│   │   └── layout/             # Sidebar, TopBar, AppLayout
│   ├── context/
│   │   └── AuthContext.tsx     # Persistent user state & 1-click demo switcher
│   ├── pages/
│   │   ├── LandingPage.tsx     # Modern hero, value props & portal entries
│   │   ├── AuthPage.tsx        # Student/Teacher login & open signup
│   │   ├── candidate/          # Student Dashboard, Key unlock bar, Exam screen, Results
│   │   └── teacher/            # Teacher Dashboard, Analytics, MCQ Editor, Access Keys
│   ├── services/
│   │   └── api.ts              # Axios client with interceptors
│   ├── App.tsx                 # React Router v7 routes
│   └── types.ts                # TypeScript interfaces
├── server.ts                   # Express server + Vite dev middleware
├── package.json
└── vite.config.ts
```

---

## 7. Environment Variables Reference

A `.env.example` file is included in the project:

```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=apex_exam_jwt_secret_token_dev_2026_super
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

All environment variables have built-in sensible defaults, allowing the application to run immediately without manual `.env` creation.
