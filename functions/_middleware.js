import { currentUser } from '../lib/auth.js';

// 첫 화면(/ = 연습 화면)은 승인된 사람만. 아니면 로그인 화면(/login)으로 보낸다.
const GATED = new Set(['/', '/index', '/index.html']);

export async function onRequest({ request, env, next }) {
  if (GATED.has(new URL(request.url).pathname)) {
    const user = await currentUser(env, request);
    if (!user || user.status !== 'approved') return Response.redirect(new URL('/login', request.url).toString(), 302);
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set('cache-control', 'no-store'); // 로그아웃 뒤 뒤로 가기로 다시 보이지 않게
    return out;
  }
  return next();
}
