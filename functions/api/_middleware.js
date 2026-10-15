import { json } from '../../lib/auth.js';

// 데이터베이스가 연결되지 않았으면 원인을 바로 알려 준다 (가입·로그인 화면에 그대로 보임).
export function onRequest({ request, env, next }) {
  if (!env.DB && new URL(request.url).pathname !== '/api/health')
    return json({ error: '데이터베이스가 연결되지 않았습니다. Cloudflare 설정에서 D1을 변수 이름 DB로 연결하고 다시 배포하세요.' }, 503);
  return next();
}
