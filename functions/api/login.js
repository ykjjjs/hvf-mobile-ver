import { ensureSchema, json, hashPassword, sameString, isAdminId, startSession, publicUser, readJson } from '../../lib/auth.js';

// 로그인: 승인 대기·거절이어도 로그인은 되고, 화면이 상태를 알려 준다. 연습 화면은 승인된 사람만 열린다.
export async function onRequestPost({ request, env }) {
  await ensureSchema(env.DB);
  const body = await readJson(request);
  const username = String(body.username || '').trim().toLowerCase();
  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  const ok = user && typeof body.password === 'string' && sameString((await hashPassword(body.password, user.pw_salt)).hash, user.pw_hash);
  if (!ok) return json({ error: '아이디 또는 비밀번호가 맞지 않습니다.' }, 401);
  if (isAdminId(env, username) && (!user.is_admin || user.status !== 'approved')) { // 관리자 아이디를 나중에 정한 경우
    await env.DB.prepare("UPDATE users SET is_admin = 1, status = 'approved' WHERE username = ?").bind(username).run();
    Object.assign(user, { is_admin: 1, status: 'approved' });
  }
  return json(publicUser(user), 200, { 'set-cookie': await startSession(env, request, username) });
}
