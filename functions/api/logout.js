import { ensureSchema, json, endSession, endSessionCookie } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  await ensureSchema(env.DB);
  await endSession(env, request);
  return json({ ok: true }, 200, { 'set-cookie': endSessionCookie(request) });
}
