import fs from 'fs';
import path from 'path';

export type CorrectionType = 'edit' | 'add' | 'remove';

export interface ReviewComment {
  id: string;
  author: string;
  authorAvatar?: string;
  body: string;
  createdAt: string;
  htmlUrl?: string;
  isReview?: boolean;
}

export interface RouteCorrectionRecord {
  id: string;
  userId: string;
  prNumber: number;
  prUrl: string;
  branchName: string;
  type: CorrectionType;
  busNumber: string;
  description: string;
  busId?: string;
  stops: string[];
  reason: string;
  submitterName?: string;
  submitterContact?: string;
  createdAt: string;
  updatedAt: string;
  baseSha: string;
  isMock?: boolean;
  mockStatus?: 'open' | 'merged' | 'closed';
  mockComments?: ReviewComment[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CORRECTIONS_FILE = path.join(DATA_DIR, 'corrections.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readCorrectionsFile(): RouteCorrectionRecord[] {
  ensureDataDir();
  if (!fs.existsSync(CORRECTIONS_FILE)) {
    fs.writeFileSync(CORRECTIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    const raw = fs.readFileSync(CORRECTIONS_FILE, 'utf-8');
    return JSON.parse(raw) as RouteCorrectionRecord[];
  } catch {
    return [];
  }
}

function writeCorrectionsFile(records: RouteCorrectionRecord[]): void {
  ensureDataDir();
  const tempPath = `${CORRECTIONS_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
  fs.writeFileSync(tempPath, JSON.stringify(records, null, 2), 'utf-8');
  fs.renameSync(tempPath, CORRECTIONS_FILE);
}

export async function getUserSubmissions(userId: string): Promise<RouteCorrectionRecord[]> {
  const all = readCorrectionsFile();
  return all
    .filter(record => record.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getSubmissionById(id: string): Promise<RouteCorrectionRecord | null> {
  const all = readCorrectionsFile();
  return all.find(record => record.id === id) || null;
}

export async function saveSubmission(submission: RouteCorrectionRecord): Promise<void> {
  const all = readCorrectionsFile();
  const existingIndex = all.findIndex(r => r.id === submission.id);
  if (existingIndex >= 0) {
    all[existingIndex] = submission;
  } else {
    all.push(submission);
  }
  writeCorrectionsFile(all);
}

export async function updateSubmission(id: string, updates: Partial<RouteCorrectionRecord>): Promise<RouteCorrectionRecord> {
  const all = readCorrectionsFile();
  const index = all.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error(`Submission with ID ${id} not found.`);
  }

  const updated: RouteCorrectionRecord = {
    ...all[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  writeCorrectionsFile(all);
  return updated;
}

