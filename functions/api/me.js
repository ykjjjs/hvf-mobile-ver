import { json, currentUser, publicUser } from '../../lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await currentUser(env, request);
  return user ? json(publicUser(user)) : json({ error: '로그인이 필요합니다.' }, 401);
}
