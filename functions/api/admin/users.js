import { json, currentUser, readJson } from '../../../lib/auth.js';

// 승인 관리 (관리자만): 목록 보기, 승인·거절·삭제
async function adminOnly(env, request) {
  const me = await currentUser(env, request);
  return me && me.is_admin && me.status === 'approved' ? me : null;
}

export async function onRequestGet({ request, env }) {
  if (!(await adminOnly(env, request))) return json({ error: '관리자만 볼 수 있습니다.' }, 403);
  const { results } = await env.DB.prepare(`SELECT username, email, status, is_admin, created_at FROM users
    ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, created_at DESC`).all();
  return json({ users: results.map(u => ({ ...u, is_admin: !!u.is_admin })) });
}

export async function onRequestPost({ request, env }) {
  const me = await adminOnly(env, request);
  if (!me) return json({ error: '관리자만 할 수 있습니다.' }, 403);
  const { username, action } = await readJson(request);
  if (!username || username === me.username) return json({ error: '자기 계정은 바꿀 수 없습니다.' }, 400);
  const status = { approve: 'approved', reject: 'rejected' }[action];
  const db = env.DB;
  if (status) {
    const r = await db.prepare('UPDATE users SET status = ? WHERE username = ?').bind(status, username).run();
    if (!r.meta.changes) return json({ error: '없는 아이디입니다.' }, 404);
    if (status === 'rejected') await db.prepare('DELETE FROM sessions WHERE username = ?').bind(username).run();
  } else if (action === 'delete') {
    await db.batch([db.prepare('DELETE FROM sessions WHERE username = ?').bind(username), db.prepare('DELETE FROM users WHERE username = ?').bind(username)]);
  } else return json({ error: '알 수 없는 요청입니다.' }, 400);
  return json({ ok: true });
}
