import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: number; // timestamp ms
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const COOKIE_NAME = 'mga_correction_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDataDir();
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export async function getUsers(): Promise<User[]> {
  return readJsonFile<User[]>(USERS_FILE, []);
}

export async function getSessions(): Promise<Session[]> {
  const sessions = readJsonFile<Session[]>(SESSIONS_FILE, []);
  const now = Date.now();
  // Filter out expired sessions
  return sessions.filter(s => s.expiresAt > now);
}

export async function registerUser(name: string, email: string, password: string): Promise<{ user: Omit<User, 'passwordHash' | 'salt'>; sessionToken: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('A valid email address is required.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!name.trim()) {
    throw new Error('Name is required.');
  }

  const users = await getUsers();
  if (users.some(u => u.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const newUser: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJsonFile(USERS_FILE, users);

  const sessionToken = await createSession(newUser.id);
  const { passwordHash: _, salt: __, ...userSafe } = newUser;
  return { user: userSafe, sessionToken };
}

export async function loginUser(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash' | 'salt'>; sessionToken: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await getUsers();
  const user = users.find(u => u.email === normalizedEmail);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    throw new Error('Invalid email or password.');
  }

  const sessionToken = await createSession(user.id);
  const { passwordHash: _, salt: __, ...userSafe } = user;
  return { user: userSafe, sessionToken };
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = await getSessions();
  sessions.push({
    token,
    userId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  writeJsonFile(SESSIONS_FILE, sessions);
  return token;
}

export async function logoutSession(token: string): Promise<void> {
  const sessions = await getSessions();
  const updated = sessions.filter(s => s.token !== token);
  writeJsonFile(SESSIONS_FILE, updated);
}

export async function getSessionUser(request: NextRequest): Promise<Omit<User, 'passwordHash' | 'salt'> | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const sessions = await getSessions();
  const session = sessions.find(s => s.token === token && s.expiresAt > Date.now());
  if (!session) return null;

  const users = await getUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) return null;

  const { passwordHash: _, salt: __, ...userSafe } = user;
  return userSafe;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });
}

