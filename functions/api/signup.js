import { ensureSchema, json, hashPassword, isAdminId, validUsername, validEmail, validPassword, startSession, publicUser, readJson } from '../../lib/auth.js';

// 가입 신청: 아이디·이메일·비밀번호만 받는다. 관리자(ADMIN_ID)가 아니면 승인 대기로 시작한다.
export async function onRequestPost({ request, env }) {
  await ensureSchema(env.DB);
  const body = await readJson(request);
  const username = String(body.username || '').trim().toLowerCase();
  const email = String(body.email || '').trim();
  if (!validUsername(username)) return json({ error: '아이디는 영문 소문자·숫자·밑줄로 4~20자입니다.' }, 400);
  if (!validEmail(email)) return json({ error: '이메일 주소를 확인하세요.' }, 400);
  if (!validPassword(body.password)) return json({ error: '비밀번호는 8자 이상입니다.' }, 400);
  if (await env.DB.prepare('SELECT 1 FROM users WHERE username = ?').bind(username).first()) return json({ error: '이미 쓰고 있는 아이디입니다.' }, 409);
  const admin = isAdminId(env, username), { hash, salt } = await hashPassword(body.password);
  const user = { username, email, status: admin ? 'approved' : 'pending', is_admin: admin ? 1 : 0 };
  await env.DB.prepare('INSERT INTO users (username, email, pw_hash, pw_salt, status, is_admin) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(username, email, hash, salt, user.status, user.is_admin).run();
  return json(publicUser(user), 201, { 'set-cookie': await startSession(env, request, username) });
}
