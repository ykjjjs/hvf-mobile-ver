// 회원·로그인 공통 코드 (Cloudflare D1 + Web Crypto).
// 저장하는 것은 아이디, 이메일, 비밀번호를 바꾼 값(PBKDF2), 승인 상태뿐이다. 이름·생년월일·전화번호는 받지 않는다.
const COOKIE = 'hfa_sid';
const SESSION_DAYS = 30;
const ITERATIONS = 100000; // Workers의 PBKDF2 최대 반복 수
const enc = new TextEncoder();

// 처음 요청 때 표를 만든다. 데이터베이스 콘솔에서 따로 명령을 넣을 필요가 없다.
let ready = null;
export function ensureSchema(db) {
  ready ||= db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      username   TEXT PRIMARY KEY,
      email      TEXT NOT NULL,
      pw_hash    TEXT NOT NULL,
      pw_salt    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      is_admin   INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      username   TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS sessions_user ON sessions (username)'),
  ]).catch(e => { ready = null; throw e; });
  return ready;
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });

const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const randomB64 = n => b64(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async s => b64(await crypto.subtle.digest('SHA-256', enc.encode(s)));

export async function hashPassword(password, saltB64 = randomB64(16)) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: ITERATIONS }, key, 256);
  return { hash: b64(bits), salt: saltB64 };
}
export function sameString(a, b) { // 길이가 같으면 끝까지 비교 (시간으로 답을 짐작하지 못하게)
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export const isAdminId = (env, username) => !!env.ADMIN_ID && username === env.ADMIN_ID.trim().toLowerCase();
export const validUsername = u => /^[a-z0-9_]{4,20}$/.test(u);
export const validEmail = e => e.length <= 254 && /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(e);
export const validPassword = p => typeof p === 'string' && p.length >= 8 && p.length <= 72;

function cookieHeader(request, value, maxAge) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
export async function startSession(env, request, username) {
  const token = randomB64(32).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c]));
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()),
    env.DB.prepare('INSERT INTO sessions (token_hash, username, expires_at) VALUES (?, ?, ?)')
      .bind(await sha256(token), username, Date.now() + SESSION_DAYS * 864e5),
  ]);
  return cookieHeader(request, token, SESSION_DAYS * 86400);
}
export const endSessionCookie = request => cookieHeader(request, '', 0);

function readToken(request) {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}
// 쿠키의 로그인 정보로 회원을 찾는다. 없거나 만료면 null
export async function currentUser(env, request) {
  const token = readToken(request);
  if (!token) return null;
  await ensureSchema(env.DB);
  return env.DB.prepare(`SELECT u.username, u.email, u.status, u.is_admin FROM sessions s JOIN users u ON u.username = s.username
    WHERE s.token_hash = ? AND s.expires_at > ?`).bind(await sha256(token), Date.now()).first();
}
export async function endSession(env, request) {
  const token = readToken(request);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
}
export const publicUser = u => ({ username: u.username, email: u.email, status: u.status, admin: !!u.is_admin });

export async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}
