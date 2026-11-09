# Simplified Zero-Database Architecture for ApexExam Platform

Simplify the full-stack Online Examination System to run without any external database dependencies by transitioning to an in-memory JSON file persistence store (`data/store.json`) with unified Node.js + React delivery deployable on Render's free tier.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following two core architectural requirements:
> - **Zero Database Requirement**: Replace MongoDB dependencies with an internal Server-Side JSON file persistence engine (`data/store.json`) synchronized with an in-memory runtime cache.
> - **Free Cloud Deployment**: Configured for Render's free web service tier (single unified container serving the Express API and built React Vite assets together).
> - **Frictionless Authentication**: Direct registration and login for both Teachers and Students without verification codes or secret keys.
> - **Zero Feature Loss**: All existing features (analytics, Recharts distributions, "Most Difficult Questions" failure rankings, MCQ authoring, unique exam access keys, countdown timers, and question palettes) remain 100% functional.

---

## 1. Overview & Core Concept

ApexExam will operate as a self-contained, monolithic Node.js + Express application that embeds the Vite React frontend. 

### Why This Simplifies Everything:
- **No Database to Install or Host**: No MongoDB Community service, no MongoDB Atlas cluster, no network whitelist configurations, and no connection timeouts.
- **Instant Local Run**: Anyone can download the repository, run `npm install`, and `npm run dev` to immediately access the full platform.
- **Zero-Config Cloud Deployment**: Deployable to Render, Railway, or Koyeb for free with a single build (`npm run build`) and start command (`npm start`).

---

## 2. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 Client (React 19 + Vite)                    │
│  Teacher Dashboard · MCQ Editor · Exam Engine · Scorecards  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON API
┌──────────────────────────────▼──────────────────────────────┐
│                  Express Server (Node.js)                   │
│         /api/auth · /api/teacher · /api/candidate           │
└──────────────────────────────┬──────────────────────────────┘
                               │ In-Memory Query & Cache
┌──────────────────────────────▼──────────────────────────────┐
│                 JSON File Storage Adapter                   │
│            server/services/jsonFileStore.ts                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Atomic Debounced Sync
┌──────────────────────────────▼──────────────────────────────┐
│                    Local File System                        │
│                     data/store.json                         │
│     (Pre-seeded with teachers, students, exams, attempts)   │
└─────────────────────────────────────────────────────────────┘
```

### Data Storage Specification (`data/store.json`)
The entire application state will reside in a structured JSON file initialized automatically with pre-seeded data if the file does not exist:
```json
{
  "users": [ ... ],
  "exams": [ ... ],
  "attempts": [ ... ]
}
```
- **Read Speed**: $O(1)$ memory lookup via internal Javascript Maps.
- **Persistence**: Debounced atomic write (`fs.promises.writeFile`) upon user creation, exam authoring, answer updates, or exam submission.
- **Portability**: Backing up or moving the platform simply involves copying the `store.json` file.

---

## 3. Deployment Strategy (100% Free Tier on Render)

The recommended free deployment target is **Render Free Web Service**:

1. **Repository Setup**: Push the project repository to GitHub or GitLab.
2. **Create Web Service on Render**:
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables:
     ```env
     NODE_ENV=production
     PORT=3000
     JWT_SECRET=apex_exam_super_secure_jwt_secret_render_free
     JWT_EXPIRES_IN=7d
     ```
3. **Outcome**: Render builds the static React assets into `dist/` and runs `server.ts`. Express serves both the REST API and the production client from the exact same domain with no CORS issues.

---

## 4. Work Breakdown & Execution Steps

### Phase 1: JSON File Persistence Engine
- Create `server/services/jsonFileStore.ts` to manage loading, caching, querying, and atomic saving to `data/store.json`.
- Populate initial seeds (Eleanor Vance as Teacher, Alex Chen as Student, pre-built exams with access keys `CLOUD-2026` and `ALGO-500`, and student attempts).
- Remove Mongoose connection dependencies while retaining the exact same API contract.

### Phase 2: Controller & Service Simplification
- Point `DataService` in `server/services/dataService.ts` directly to the `jsonFileStore`.
- Ensure open registration for teachers and candidates without verification or secret keys.
- Preserve all analytics calculation logic (cohort distribution, pass vs. fail ratio, and ranked "Most Difficult Questions").

### Phase 3: Build & Deployment Verification
- Verify clean build (`npm run build`) and TypeScript check (`npm run lint`).
- Update `README.md` and `.env.example` with the simplified 1-step local startup and Render deployment instructions.
