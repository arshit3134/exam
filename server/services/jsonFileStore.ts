import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { ExamAttemptDoc, ExamDoc, UserDoc } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to data/store.json
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface StoreData {
  users: UserDoc[];
  exams: ExamDoc[];
  attempts: ExamAttemptDoc[];
}

export class JsonFileStore {
  private users: Map<string, UserDoc> = new Map();
  private exams: Map<string, ExamDoc> = new Map();
  private attempts: Map<string, ExamAttemptDoc> = new Map();
  private saveTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        if (raw.trim()) {
          const parsed: StoreData = JSON.parse(raw);
          parsed.users?.forEach((u) => this.users.set(u._id, u));
          parsed.exams?.forEach((e) => this.exams.set(e._id, e));
          parsed.attempts?.forEach((a) => this.attempts.set(a._id, a));
          console.log(`[JSON Store] Loaded ${this.users.size} users, ${this.exams.size} exams, ${this.attempts.size} attempts from ${STORE_PATH}`);
          this.isInitialized = true;
          return;
        }
      }

      // If file doesn't exist or is empty, seed initial data
      await this.seedInitialData();
      await this.persistToDisk();
      this.isInitialized = true;
      console.log(`[JSON Store] Initialized and seeded data to ${STORE_PATH}`);
    } catch (err) {
      console.error('[JSON Store] Error initializing store:', err);
      // Fallback: seed in memory
      await this.seedInitialData();
      this.isInitialized = true;
    }
  }

  // Schedule an atomic disk write
  private scheduleSave(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persistToDisk().catch((err) => console.error('[JSON Store] Background write failed:', err));
    }, 200);
  }

  async persistToDisk(): Promise<void> {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const data: StoreData = {
        users: Array.from(this.users.values()),
        exams: Array.from(this.exams.values()),
        attempts: Array.from(this.attempts.values()),
      };

      const tempPath = STORE_PATH + '.tmp';
      await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      await fs.promises.rename(tempPath, STORE_PATH);
    } catch (err) {
      console.error('[JSON Store] Failed to save to disk:', err);
    }
  }

  // --- USERS ---
  findUserByEmail(email: string): UserDoc | null {
    const normalized = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) return { ...u };
    }
    return null;
  }

  findUserById(id: string): UserDoc | null {
    const u = this.users.get(id);
    return u ? { ...u } : null;
  }

  createUser(data: Omit<UserDoc, '_id' | 'createdAt' | 'updatedAt'>): UserDoc {
    const id = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const now = new Date();
    const newUser: UserDoc = {
      _id: id,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: data.password,
      role: data.role,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    this.scheduleSave();
    return { ...newUser };
  }

  getAllCandidates(): UserDoc[] {
    return Array.from(this.users.values())
      .filter((u) => u.role === 'candidate')
      .map((u) => ({ ...u }));
  }

  // --- EXAMS ---
  getAllExams(filter?: { status?: 'Draft' | 'Published'; createdBy?: string }): ExamDoc[] {
    let list = Array.from(this.exams.values());
    if (filter?.status) {
      list = list.filter((e) => e.status === filter.status);
    }
    if (filter?.createdBy) {
      list = list.filter((e) => e.createdBy === filter.createdBy);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findExamById(id: string): ExamDoc | null {
    const e = this.exams.get(id);
    return e ? JSON.parse(JSON.stringify(e)) : null;
  }

  findExamByAccessKey(key: string): ExamDoc | null {
    const normalized = key.trim().toUpperCase();
    for (const e of this.exams.values()) {
      if (e.accessKey && e.accessKey.toUpperCase() === normalized) {
        return JSON.parse(JSON.stringify(e));
      }
    }
    return null;
  }

  createExam(data: Omit<ExamDoc, '_id' | 'createdAt' | 'updatedAt'>): ExamDoc {
    const id = 'exm_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const now = new Date();
    const formattedKey =
      data.accessKey?.trim().toUpperCase() ||
      'EXAM-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const newExam: ExamDoc = {
      _id: id,
      ...data,
      accessKey: formattedKey,
      createdAt: now,
      updatedAt: now,
    };

    this.exams.set(id, newExam);
    this.scheduleSave();
    return JSON.parse(JSON.stringify(newExam));
  }

  updateExam(id: string, updates: Partial<ExamDoc>): ExamDoc | null {
    const existing = this.exams.get(id);
    if (!existing) return null;

    const merged: ExamDoc = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.exams.set(id, merged);
    this.scheduleSave();
    return JSON.parse(JSON.stringify(merged));
  }

  deleteExam(id: string): boolean {
    const deleted = this.exams.delete(id);
    for (const [attId, att] of this.attempts.entries()) {
      if (att.examId === id) this.attempts.delete(attId);
    }
    this.scheduleSave();
    return deleted;
  }

  // --- ATTEMPTS ---
  createAttempt(data: Omit<ExamAttemptDoc, '_id' | 'createdAt' | 'updatedAt'>): ExamAttemptDoc {
    const id = 'att_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const now = new Date();
    const newAttempt: ExamAttemptDoc = {
      _id: id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.attempts.set(id, newAttempt);
    this.scheduleSave();
    return JSON.parse(JSON.stringify(newAttempt));
  }

  findAttemptById(id: string): ExamAttemptDoc | null {
    const a = this.attempts.get(id);
    return a ? JSON.parse(JSON.stringify(a)) : null;
  }

  updateAttempt(id: string, updates: Partial<ExamAttemptDoc>): ExamAttemptDoc | null {
    const existing = this.attempts.get(id);
    if (!existing) return null;

    const merged: ExamAttemptDoc = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.attempts.set(id, merged);
    this.scheduleSave();
    return JSON.parse(JSON.stringify(merged));
  }

  findAttemptsByCandidate(candidateId: string): ExamAttemptDoc[] {
    return Array.from(this.attempts.values())
      .filter((a) => a.candidateId === candidateId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findAttemptsByExam(examId: string): ExamAttemptDoc[] {
    return Array.from(this.attempts.values())
      .filter((a) => a.examId === examId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllAttempts(): ExamAttemptDoc[] {
    return Array.from(this.attempts.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- SEED DATA ---
  async seedInitialData(): Promise<void> {
    const teacherHash = await bcrypt.hash('TeacherPass123!', 10);
    const candidateHash = await bcrypt.hash('StudentPass123!', 10);

    const teacher = this.createUser({
      name: 'Dr. Eleanor Vance',
      email: 'teacher@apexexam.io',
      password: teacherHash,
      role: 'teacher',
    });

    const student1 = this.createUser({
      name: 'Alex Chen',
      email: 'student@apexexam.io',
      password: candidateHash,
      role: 'candidate',
    });

    const student2 = this.createUser({
      name: 'Sarah Jenkins',
      email: 'sarah.j@apexexam.io',
      password: candidateHash,
      role: 'candidate',
    });

    const student3 = this.createUser({
      name: 'Marcus King',
      email: 'marcus.k@apexexam.io',
      password: candidateHash,
      role: 'candidate',
    });

    const student4 = this.createUser({
      name: 'Priya Patel',
      email: 'priya.p@apexexam.io',
      password: candidateHash,
      role: 'candidate',
    });

    // Seed Exam 1: Distributed Systems
    const exam1 = this.createExam({
      title: 'Distributed Systems & Cloud Architecture',
      description: 'Comprehensive assessment on consensus protocols, microservice patterns, CAP theorem, and event-driven communication.',
      subject: 'Computer Science & Engineering',
      duration: 30,
      totalMarks: 25,
      passingPercentage: 60,
      accessKey: 'CLOUD-2026',
      status: 'Published',
      resultReleaseSettings: 'immediate',
      createdBy: teacher._id,
      createdByName: teacher.name,
      allowMultipleAttempts: false,
      questions: [
        {
          id: 'q1',
          order: 1,
          questionText: 'According to the CAP Theorem, which two guarantees can a partition-tolerant distributed database provide simultaneously during a network partition?',
          marks: 5,
          options: [
            { key: 'A', text: 'Consistency or Availability, but not both' },
            { key: 'B', text: 'Consistency and Absolute Performance' },
            { key: 'C', text: 'Atomicity and High Concurrency' },
            { key: 'D', text: 'Availability and Latency-free Read Operations' },
          ],
          correctOption: 'A',
          explanation: 'The CAP theorem states that in the presence of a network partition (P), a distributed system must choose between either Consistency (C) or Availability (A).',
        },
        {
          id: 'q2',
          order: 2,
          questionText: 'What is the primary role of the Raft consensus algorithm?',
          marks: 5,
          options: [
            { key: 'A', text: 'Compressing database write-ahead logs' },
            { key: 'B', text: 'Managing a replicated log across cluster nodes through leader election' },
            { key: 'C', text: 'Load balancing HTTP requests round-robin' },
            { key: 'D', text: 'Encrypting payload transit over TLS' },
          ],
          correctOption: 'B',
          explanation: 'Raft manages replicated logs across a distributed cluster by electing a distinguished leader, replicating log entries, and ensuring state machine safety.',
        },
        {
          id: 'q3',
          order: 3,
          questionText: 'Which architectural pattern is best suited for maintaining data consistency across multiple microservices without distributed 2-phase commit locks?',
          marks: 5,
          options: [
            { key: 'A', text: 'Saga Pattern (Orchestration or Choreography)' },
            { key: 'B', text: 'Monolithic Single Table Inheritance' },
            { key: 'C', text: 'Active-Active Synchronous Replication' },
            { key: 'D', text: 'Global Thread Synchronization Lock' },
          ],
          correctOption: 'A',
          explanation: 'The Saga pattern executes a series of local transactions coordinated via events or an orchestrator, with compensating transactions to handle rollbacks without holding distributed locks.',
        },
        {
          id: 'q4',
          order: 4,
          questionText: 'In event-driven microservices, what does the "Outbox Pattern" guarantee?',
          marks: 5,
          options: [
            { key: 'A', text: 'Atomic updates between local database persistence and outbound message publishing' },
            { key: 'B', text: 'Unlimited queue buffering without memory exhaustion' },
            { key: 'C', text: 'Automatic encryption of database passwords' },
            { key: 'D', text: 'Zero latency client websockets' },
          ],
          correctOption: 'A',
          explanation: 'The Outbox Pattern writes domain changes and outbound event records within the same ACID database transaction, preventing message loss or dual-write inconsistency.',
        },
        {
          id: 'q5',
          order: 5,
          questionText: 'Which cache invalidation technique writes directly to cache and asynchronously flushes data to the backing store?',
          marks: 5,
          options: [
            { key: 'A', text: 'Write-Through' },
            { key: 'B', text: 'Write-Back (Write-Behind)' },
            { key: 'C', text: 'Cache-Aside' },
            { key: 'D', text: 'Read-Through' },
          ],
          correctOption: 'B',
          explanation: 'In Write-Back (Write-Behind), data is written to cache immediately and confirmed to caller, then lazily flushed to persistent storage in batch.',
        },
      ],
    });

    // Seed Exam 2: Data Structures & Algorithms
    const exam2 = this.createExam({
      title: 'Advanced Data Structures & Complexity',
      description: 'Rigorous examination testing graph algorithms, asymptotic complexity, tree balance, and dynamic programming invariants.',
      subject: 'Algorithms & Mathematics',
      duration: 20,
      totalMarks: 20,
      passingPercentage: 50,
      accessKey: 'ALGO-500',
      status: 'Published',
      resultReleaseSettings: 'immediate',
      createdBy: teacher._id,
      createdByName: teacher.name,
      allowMultipleAttempts: false,
      questions: [
        {
          id: 'a1',
          order: 1,
          questionText: 'What is the tightest worst-case time complexity of finding a shortest path in a weighted directed graph with non-negative edges using Dijkstra with a Min-Heap?',
          marks: 5,
          options: [
            { key: 'A', text: 'O((V + E) log V)' },
            { key: 'B', text: 'O(V^2)' },
            { key: 'C', text: 'O(V * E)' },
            { key: 'D', text: 'O(E log E * V)' },
          ],
          correctOption: 'A',
          explanation: 'Dijkstra with a binary min-heap operates in O((V + E) log V) where each vertex extraction takes O(log V) and each edge relaxation takes O(log V).',
        },
        {
          id: 'a2',
          order: 2,
          questionText: 'Which self-balancing binary search tree guarantees that the height never exceeds approximately 1.44 * log2(n)?',
          marks: 5,
          options: [
            { key: 'A', text: 'AVL Tree' },
            { key: 'B', text: 'Splay Tree' },
            { key: 'C', text: 'B-Tree' },
            { key: 'D', text: 'Trie' },
          ],
          correctOption: 'A',
          explanation: 'AVL trees enforce a strict balance factor difference of at most 1, keeping max height bounded by 1.44 * log2(n).',
        },
        {
          id: 'a3',
          order: 3,
          questionText: 'In dynamic programming, what property allows an optimal global solution to be constructed from optimal solutions to its subproblems?',
          marks: 5,
          options: [
            { key: 'A', text: 'Optimal Substructure' },
            { key: 'B', text: 'Greedy Choice Property' },
            { key: 'C', text: 'Amortized Bound' },
            { key: 'D', text: 'Markovian State Space' },
          ],
          correctOption: 'A',
          explanation: 'Optimal substructure means an optimal solution to the problem contains within it optimal solutions to subproblems.',
        },
        {
          id: 'a4',
          order: 4,
          questionText: 'Which algorithm detects negative weight cycles in a directed graph?',
          marks: 5,
          options: [
            { key: 'A', text: 'Bellman-Ford Algorithm' },
            { key: 'B', text: 'Kruskal Algorithm' },
            { key: 'C', text: 'Prim Algorithm' },
            { key: 'D', text: 'Kosaraju Algorithm' },
          ],
          correctOption: 'A',
          explanation: 'Bellman-Ford relaxes all edges V-1 times; if another relaxation still yields a shorter distance on the Vth pass, a negative cycle exists.',
        },
      ],
    });

    // Seed student attempts for instant analytics & Difficult Questions ranking
    this.createAttempt({
      examId: exam1._id,
      examTitle: exam1.title,
      candidateId: student1._id,
      candidateName: student1.name,
      candidateEmail: student1.email,
      answers: { q1: 'A', q2: 'B', q3: 'A', q4: 'A', q5: 'A' },
      score: 20,
      percentage: 80,
      correctCount: 4,
      incorrectCount: 1,
      unansweredCount: 0,
      startedAt: new Date(Date.now() - 3600000 * 4),
      submittedAt: new Date(Date.now() - 3600000 * 3.5),
      timeTaken: 1320,
      status: 'submitted',
      resultReleased: true,
    });

    this.createAttempt({
      examId: exam1._id,
      examTitle: exam1.title,
      candidateId: student2._id,
      candidateName: student2.name,
      candidateEmail: student2.email,
      answers: { q1: 'A', q2: 'B', q3: 'A', q4: 'B', q5: 'C' },
      score: 15,
      percentage: 60,
      correctCount: 3,
      incorrectCount: 2,
      unansweredCount: 0,
      startedAt: new Date(Date.now() - 3600000 * 8),
      submittedAt: new Date(Date.now() - 3600000 * 7.6),
      timeTaken: 1440,
      status: 'submitted',
      resultReleased: true,
    });

    this.createAttempt({
      examId: exam1._id,
      examTitle: exam1.title,
      candidateId: student3._id,
      candidateName: student3.name,
      candidateEmail: student3.email,
      answers: { q1: 'A', q2: 'C', q3: 'A', q4: 'C', q5: 'C' },
      score: 10,
      percentage: 40,
      correctCount: 2,
      incorrectCount: 3,
      unansweredCount: 0,
      startedAt: new Date(Date.now() - 3600000 * 12),
      submittedAt: new Date(Date.now() - 3600000 * 11.5),
      timeTaken: 1560,
      status: 'submitted',
      resultReleased: true,
    });

    this.createAttempt({
      examId: exam1._id,
      examTitle: exam1.title,
      candidateId: student4._id,
      candidateName: student4.name,
      candidateEmail: student4.email,
      answers: { q1: 'A', q2: 'B', q3: 'A', q4: 'A', q5: 'B' },
      score: 25,
      percentage: 100,
      correctCount: 5,
      incorrectCount: 0,
      unansweredCount: 0,
      startedAt: new Date(Date.now() - 3600000 * 20),
      submittedAt: new Date(Date.now() - 3600000 * 19.4),
      timeTaken: 1100,
      status: 'submitted',
      resultReleased: true,
    });

    this.createAttempt({
      examId: exam2._id,
      examTitle: exam2.title,
      candidateId: student2._id,
      candidateName: student2.name,
      candidateEmail: student2.email,
      answers: { a1: 'A', a2: 'B', a3: 'A', a4: 'A' },
      score: 15,
      percentage: 75,
      correctCount: 3,
      incorrectCount: 1,
      unansweredCount: 0,
      startedAt: new Date(Date.now() - 3600000 * 2),
      submittedAt: new Date(Date.now() - 3600000 * 1.7),
      timeTaken: 720,
      status: 'submitted',
      resultReleased: true,
    });

    this.createAttempt({
      examId: exam2._id,
      examTitle: exam2.title,
      candidateId: student4._id,
      candidateName: student4.name,
      candidateEmail: student4.email,
      answers: { a1: 'A', a2: 'A', a3: 'A', a4: 'A' },
      score: 20,
      percentage: 100,
      correctCount: 4,
      incorrectCount: 0,
      unansweredCount: 0,
      startedAt: new Date(Date.now() - 3600000 * 6),
      submittedAt: new Date(Date.now() - 3600000 * 5.8),
      timeTaken: 650,
      status: 'submitted',
      resultReleased: true,
    });
  }
}

export const jsonStore = new JsonFileStore();
