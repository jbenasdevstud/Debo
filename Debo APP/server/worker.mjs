import { legalPage } from './legal.mjs';

const MODEL_DEFAULT = 'gpt-6-luna';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT_PER_IP = 20;
const hitsByIp = new Map();
const signupsByIp = new Map();
const loginFailures = new Map();
const LOGIN_FAIL_LIMIT = 8;
const LOGIN_FAIL_WINDOW_MS = 15 * 60 * 1000;
const MEMBERSHIP = Object.freeze({ membership_monthly: true, membership_annual: true });
const MEMBER_STATES = new Set(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED']);
const USER_COLUMNS = 'id, email, name, credits, membership_until, membership_product';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
let cachedGoogleJwks = null;
let googleJwksExpiresAt = 0;

const schema = {
  type: 'object',
  properties: {
    items: { type: 'array', items: { type: 'object', properties: {
      name: { type: 'string' }, estimatedGrams: { type: 'number' }, carbohydratesG: { type: 'number' },
      proteinG: { type: 'number' }, fatG: { type: 'number' }, glycemicIndex: { type: ['integer', 'null'] },
      glycemicIndexNote: { type: 'string' }, confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      uncertainty: { type: 'string' }
    }, required: ['name', 'estimatedGrams', 'carbohydratesG', 'proteinG', 'fatG', 'glycemicIndex', 'glycemicIndexNote', 'confidence', 'uncertainty'], additionalProperties: false } },
    overallNote: { type: 'string' }
  }, required: ['items', 'overallNote'], additionalProperties: false
};

function base64url(bytes) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function decode64url(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')), c => c.charCodeAt(0));
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }});
}
function b64text(value) { return btoa(String.fromCharCode(...new TextEncoder().encode(value))); }
function unb64text(value) { return new TextDecoder().decode(Uint8Array.from(atob(value), c => c.charCodeAt(0))); }
async function passwordHash(password, salt) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 }, material, 256);
  return base64url(bits);
}
async function makeToken(user, env) {
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(new TextEncoder().encode(JSON.stringify({ sub: user.id, email: user.email, iat: now, exp: now + 60 * 60 * 24 * 30 })));
  const body = `${header}.${payload}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${body}.${base64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))}`;
}
async function authenticatedUser(request, env) {
  if (!env.JWT_SECRET) throw new Error('AUTH_NOT_CONFIGURED');
  const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  try {
    const [head, body, sig] = token.split('.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, decode64url(sig), new TextEncoder().encode(`${head}.${body}`));
    const claims = JSON.parse(unb64text(body));
    if (!valid || claims.exp < Date.now() / 1000) return null;
    let row;
    try { row = await env.DB.prepare(`SELECT ${USER_COLUMNS}, password_changed_at FROM users WHERE id = ?`).bind(claims.sub).first(); }
    catch {
      try { row = await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).bind(claims.sub).first(); }
      catch { row = await env.DB.prepare('SELECT id, email, name, credits FROM users WHERE id = ?').bind(claims.sub).first(); }
    }
    if (row && Number(row.password_changed_at) > (Number(claims.iat) || 0) * 1000) return null;
    return publicUser(row);
  } catch { return null; }
}
function publicUser(user) {
  if (!user) return null;
  const membershipUntil = Number(user.membership_until) || 0;
  return {
    id: user.id, email: user.email, name: user.name, credits: user.credits,
    membershipUntil, membershipProduct: user.membership_product || '',
    member: membershipUntil > Date.now()
  };
}
function hasMembership(user) { return Boolean(user?.member) || Number(user?.membershipUntil || user?.membership_until) > Date.now(); }
function validResult(value) {
  return value && Array.isArray(value.items) && value.items.length <= 12 && typeof value.overallNote === 'string' &&
    value.items.every(item => item && typeof item.name === 'string' &&
      ['estimatedGrams', 'carbohydratesG', 'proteinG', 'fatG'].every(k => Number.isFinite(item[k]) && item[k] >= 0 && item[k] <= 10000) &&
      (item.glycemicIndex === null || (Number.isInteger(item.glycemicIndex) && item.glycemicIndex >= 0 && item.glycemicIndex <= 100)) &&
      ['low', 'medium', 'high'].includes(item.confidence) && typeof item.glycemicIndexNote === 'string' && typeof item.uncertainty === 'string');
}

async function authRoute(request, env, route) {
  if (!env.DB || !env.JWT_SECRET) return json({ error: 'Serverio paskyros paslauga dar nesukonfigūruota.' }, 503);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'Netinkami duomenys.' }, 400); }
  if (route === '/api/auth/google') {
    const identity = await verifyGoogleIdToken(String(input.idToken || ''), String(input.nonce || ''), env);
    if (!identity) return json({ error: 'Google prisijungimo patvirtinti nepavyko.' }, 401);
    const nonceHash = base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(input.nonce))));
    await env.DB.prepare('DELETE FROM google_auth_nonces WHERE expires_at < ?').bind(Date.now()).run();
    const nonceUse = await env.DB.prepare('INSERT OR IGNORE INTO google_auth_nonces (nonce_hash,expires_at) VALUES (?,?)')
      .bind(nonceHash, identity.exp * 1000).run();
    if (!nonceUse.meta?.changes) return json({ error: 'Šis Google prisijungimo bandymas jau panaudotas. Bandykite dar kartą.' }, 401);
    const { sub, email, name } = identity;
    let user = publicUser(await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE google_sub = ?`).bind(sub).first());
    if (!user) {
      const byEmail = await env.DB.prepare(`SELECT ${USER_COLUMNS}, google_sub FROM users WHERE email = ?`).bind(email).first();
      if (byEmail) {
        if (byEmail.google_sub && byEmail.google_sub !== sub) return json({ error: 'Šis el. paštas jau susietas su kita Google paskyra.' }, 409);
        await env.DB.prepare('UPDATE users SET google_sub = ? WHERE id = ? AND (google_sub IS NULL OR google_sub = ?)').bind(sub, byEmail.id, sub).run();
        user = publicUser(await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).bind(byEmail.id).first());
      } else {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const recentSignups = (signupsByIp.get(ip) || []).filter(ts => Date.now() - ts < WINDOW_MS);
        if (recentSignups.length >= 5) return json({ error: 'Per daug paskyrų iš šio tinklo. Bandykite vėliau.' }, 429);
        recentSignups.push(Date.now()); signupsByIp.set(ip, recentSignups);
        const id = crypto.randomUUID();
        const salt = base64url(crypto.getRandomValues(new Uint8Array(16)));
        const unusablePasswordHash = base64url(crypto.getRandomValues(new Uint8Array(32)));
        try {
          await env.DB.prepare('INSERT INTO users (id,email,name,password_salt,password_hash,credits,created_at,google_sub) VALUES (?,?,?,?,?,3,?,?)')
            .bind(id, email, name || email.split('@')[0], salt, unusablePasswordHash, Date.now(), sub).run();
        } catch (error) {
          if (!String(error).toLowerCase().includes('unique')) throw error;
          user = publicUser(await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE google_sub = ?`).bind(sub).first());
          if (!user) return json({ error: 'Nepavyko sukurti Google paskyros. Bandykite dar kartą.' }, 409);
        }
        if (!user) user = publicUser({ id, email, name: name || email.split('@')[0], credits: 3, membership_until: 0, membership_product: '' });
      }
    }
    if (!user) return json({ error: 'Nepavyko atkurti Google paskyros.' }, 503);
    return json({ token: await makeToken(user, env), user, freeCreditsGranted: user.credits === 3 });
  }
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128) return json({ error: 'Įveskite el. paštą ir bent 8 ženklų slaptažodį.' }, 400);
  if (route === '/api/auth/register') {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const recentSignups = (signupsByIp.get(ip) || []).filter(ts => Date.now() - ts < WINDOW_MS);
    if (recentSignups.length >= 5) return json({ error: 'Per daug paskyrų iš šio tinklo. Bandykite vėliau.' }, 429);
    recentSignups.push(Date.now()); signupsByIp.set(ip, recentSignups);
    const name = String(input.name || '').trim().slice(0, 80);
    if (!name) return json({ error: 'Įveskite vardą.' }, 400);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await passwordHash(password, salt);
    const id = crypto.randomUUID();
    try {
      await env.DB.prepare('INSERT INTO users (id,email,name,password_salt,password_hash,credits,created_at) VALUES (?,?,?,?,?,3,?)')
        .bind(id, email, name, base64url(salt), hash, Date.now()).run();
    } catch (error) {
      if (String(error).toLowerCase().includes('unique')) return json({ error: 'Paskyra su šiuo el. paštu jau sukurta.' }, 409);
      console.error('Account registration failed:', error.message); return json({ error: 'Nepavyko sukurti paskyros.' }, 503);
    }
    const user = publicUser({ id, email, name, credits: 3, membership_until: 0, membership_product: '' });
    return json({ token: await makeToken(user, env), user, freeCreditsGranted: true });
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const failKey = `${ip}|${email}`;
  const recentFails = (loginFailures.get(failKey) || []).filter(ts => Date.now() - ts < LOGIN_FAIL_WINDOW_MS);
  if (recentFails.length >= LOGIN_FAIL_LIMIT) return json({ error: 'Per daug nesėkmingų bandymų. Pabandykite po kelių minučių.' }, 429);
  const user = await env.DB.prepare(`SELECT ${USER_COLUMNS}, password_salt, password_hash FROM users WHERE email = ?`).bind(email).first();
  if (!user || await passwordHash(password, decode64url(user.password_salt)) !== user.password_hash) {
    recentFails.push(Date.now());
    loginFailures.set(failKey, recentFails);
    return json({ error: 'Neteisingas el. paštas arba slaptažodis.' }, 401);
  }
  loginFailures.delete(failKey);
  return json({ token: await makeToken(user, env), user: publicUser(user) });
}

async function passwordChangeRoute(request, env, user) {
  let input;
  try { input = await request.json(); } catch { return json({ error: 'Netinkami duomenys.' }, 400); }
  const current = String(input.currentPassword || '');
  const next = String(input.newPassword || '');
  if (next.length < 8 || next.length > 128) return json({ error: 'Naujas slaptažodis turi būti bent 8 ženklų.' }, 400);
  const row = await env.DB.prepare('SELECT password_salt, password_hash FROM users WHERE id = ?').bind(user.id).first();
  if (!row) return json({ error: 'Paskyra nerasta.' }, 404);
  if (await passwordHash(current, decode64url(row.password_salt)) !== row.password_hash) return json({ error: 'Dabartinis slaptažodis neteisingas.' }, 403);
  await setPassword(env, user.id, next);
  return json({ ok: true, token: await makeToken(user, env) });
}

async function setPassword(env, userId, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await passwordHash(password, salt);
  const changedAt = Math.floor(Date.now() / 1000) * 1000;
  try {
    await env.DB.prepare('UPDATE users SET password_salt = ?, password_hash = ?, password_changed_at = ? WHERE id = ?').bind(base64url(salt), hash, changedAt, userId).run();
  } catch {
    await env.DB.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?').bind(base64url(salt), hash, userId).run();
  }
}

const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;
const RESET_SENDS_PER_HOUR = 3;
const RESET_RESEND_MS = 60 * 1000;
const resetRequestsByIp = new Map();

async function resetCodeHash(env, userId, code) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`reset:${userId}:${code}`)));
}

// The app sends its UI language; anything unknown gets English
const LANGUAGE_NAMES = { lt: 'Lithuanian', en: 'English', lv: 'Latvian', pl: 'Polish', de: 'German' };
const RESET_EMAIL_TEXT = {
  lt: ['Debo slaptažodžio atkūrimo kodas', 'Įveskite šį kodą programėlėje „Debo“, kad pakeistumėte slaptažodį:', 'Kodas galioja 15 minučių.', 'Jei slaptažodžio atkurti neprašėte, šį laišką ignoruokite – slaptažodis nepasikeis.'],
  en: ['Debo password reset code', 'Use this code to reset your Debo password:', 'The code is valid for 15 minutes.', 'If you did not ask to reset your password, ignore this email – your password will not change.'],
  lv: ['Debo paroles atjaunošanas kods', 'Ievadiet šo kodu lietotnē Debo, lai nomainītu paroli:', 'Kods ir derīgs 15 minūtes.', 'Ja neesat lūdzis atjaunot paroli, ignorējiet šo e-pastu – parole netiks mainīta.'],
  pl: ['Kod do resetu hasła Debo', 'Wpisz ten kod w aplikacji Debo, aby zmienić hasło:', 'Kod jest ważny 15 minut.', 'Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość – hasło się nie zmieni.'],
  de: ['Debo-Code zum Zurücksetzen des Passworts', 'Geben Sie diesen Code in der Debo-App ein, um Ihr Passwort zu ändern:', 'Der Code ist 15 Minuten gültig.', 'Wenn Sie kein neues Passwort angefordert haben, ignorieren Sie diese E-Mail – Ihr Passwort bleibt unverändert.']
};

function resetEmail(code, language) {
  const [title, ...lines] = RESET_EMAIL_TEXT[language] || RESET_EMAIL_TEXT.en;
  const subject = `${title}: ${code}`;
  const text = `${lines[0]}\n\n${code}\n\n${lines[1]}\n${lines[2]}\n\nDebo`;
  const html = `<!doctype html><html><body style="margin:0;background:#F5F7F4;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#1F2D2B"><div style="max-width:480px;margin:0 auto;padding:28px 18px"><div style="font-weight:800;letter-spacing:.14em;color:#2E7466">DEBO</div><div style="margin-top:16px;padding:24px;border:1px solid #E1E8E3;border-radius:18px;background:#FFFFFF"><p style="margin:0 0 16px;font-size:16px;line-height:1.5">${lines[0]}</p><div style="margin:0 0 16px;padding:14px;border-radius:12px;background:#E5F2EC;color:#1F2D2B;font-size:32px;font-weight:800;letter-spacing:.3em;text-align:center">${code}</div><p style="margin:0 0 8px;font-size:14px;color:#5C6C68">${lines[1]}</p><p style="margin:0;font-size:14px;color:#5C6C68">${lines[2]}</p></div></div></body></html>`;
  return { subject, text, html };
}

async function sendEmail(env, { to, subject, text, html }) {
  const from = String(env.EMAIL_FROM || '').trim();
  const fromName = String(env.EMAIL_FROM_NAME || 'Debo').trim();
  if (!from) throw new Error('EMAIL_NOT_CONFIGURED');
  let response;
  if (env.BREVO_API_KEY) {
    response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sender: { email: from, name: fromName }, to: [{ email: to }], subject, textContent: text, htmlContent: html })
    });
  } else if (env.RESEND_API_KEY) {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <${from}>`, to: [to], subject, text, html })
    });
  } else throw new Error('EMAIL_NOT_CONFIGURED');
  if (!response.ok) throw new Error(`EMAIL_SEND_FAILED_${response.status}`);
}

async function resetRequestRoute(request, env) {
  if (!env.DB || !env.JWT_SECRET) return json({ error: 'Serverio paskyros paslauga dar nesukonfigūruota.' }, 503);
  if (!env.EMAIL_FROM || (!env.BREVO_API_KEY && !env.RESEND_API_KEY)) return json({ error: 'El. laiškų siuntimas dar nesukonfigūruotas.', code: 'email_not_configured' }, 503);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'Netinkami duomenys.' }, 400); }
  const email = String(input.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: 'Įveskite teisingą el. paštą.', code: 'invalid_email' }, 400);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const recent = (resetRequestsByIp.get(ip) || []).filter(ts => now - ts < WINDOW_MS);
  if (recent.length >= 10) return json({ error: 'Per daug užklausų. Bandykite vėliau.' }, 429);
  recent.push(now); resetRequestsByIp.set(ip, recent);
  const user = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?').bind(email).first();
  if (!user) return json({ ok: true });
  const existing = await env.DB.prepare('SELECT sent_count, window_start, last_sent_at FROM password_resets WHERE user_id = ?').bind(user.id).first();
  const windowFresh = existing && now - Number(existing.window_start) < WINDOW_MS;
  const sentCount = windowFresh ? Number(existing.sent_count) : 0;
  if (existing && now - Number(existing.last_sent_at) < RESET_RESEND_MS) return json({ ok: true });
  if (sentCount >= RESET_SENDS_PER_HOUR) return json({ ok: true });
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
  const message = resetEmail(code, String(input.language || ''));
  try {
    await sendEmail(env, { to: user.email, ...message });
  } catch (error) {
    console.error('Password reset email failed:', error.message);
    return json({ error: 'Nepavyko išsiųsti laiško. Bandykite vėliau.', code: 'email_failed' }, 502);
  }
  await env.DB.prepare('INSERT INTO password_resets (user_id,code_hash,expires_at,attempts,sent_count,window_start,last_sent_at) VALUES (?,?,?,0,?,?,?) ON CONFLICT(user_id) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at, attempts=0, sent_count=excluded.sent_count, window_start=excluded.window_start, last_sent_at=excluded.last_sent_at')
    .bind(user.id, await resetCodeHash(env, user.id, code), now + RESET_CODE_TTL_MS, sentCount + 1, windowFresh ? Number(existing.window_start) : now, now).run();
  return json({ ok: true });
}

async function resetConfirmRoute(request, env) {
  if (!env.DB || !env.JWT_SECRET) return json({ error: 'Serverio paskyros paslauga dar nesukonfigūruota.' }, 503);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'Netinkami duomenys.' }, 400); }
  const email = String(input.email || '').trim().toLowerCase();
  const code = String(input.code || '').replace(/\s/g, '');
  const next = String(input.newPassword || '');
  if (next.length < 8 || next.length > 128) return json({ error: 'Naujas slaptažodis turi būti bent 8 ženklų.', code: 'weak_password' }, 400);
  const invalid = () => json({ error: 'Kodas neteisingas arba nebegalioja.', code: 'invalid_code' }, 400);
  if (!/^\d{6}$/.test(code)) return invalid();
  const user = await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`).bind(email).first();
  if (!user) return invalid();
  const reset = await env.DB.prepare('SELECT code_hash, expires_at, attempts FROM password_resets WHERE user_id = ?').bind(user.id).first();
  if (!reset || Number(reset.expires_at) < Date.now() || Number(reset.attempts) >= RESET_MAX_ATTEMPTS) return invalid();
  const expected = await resetCodeHash(env, user.id, code);
  if (!sameSecret(expected, reset.code_hash)) {
    await env.DB.prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE user_id = ?').bind(user.id).run();
    return invalid();
  }
  await setPassword(env, user.id, next);
  await env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(user.id).run();
  for (const key of loginFailures.keys()) if (key.endsWith(`|${email}`)) loginFailures.delete(key);
  const fresh = publicUser(await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).bind(user.id).first());
  return json({ token: await makeToken(fresh, env), user: fresh });
}

async function deleteAccountRoute(env, user) {
  try { await env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(user.id).run(); } catch { }
  await env.DB.batch([
    env.DB.prepare('DELETE FROM purchases WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id)
  ]);
  return json({ ok: true });
}

function decodeJwtPart(value) {
  try { return JSON.parse(new TextDecoder().decode(decode64url(value))); } catch { return null; }
}
async function googleSigningKeys() {
  if (cachedGoogleJwks && Date.now() < googleJwksExpiresAt) return cachedGoogleJwks;
  const response = await fetch(GOOGLE_JWKS_URL);
  if (!response.ok) throw new Error('GOOGLE_KEYS_UNAVAILABLE');
  const payload = await response.json();
  if (!Array.isArray(payload.keys)) throw new Error('GOOGLE_KEYS_INVALID');
  const maxAge = Number(response.headers.get('Cache-Control')?.match(/max-age=(\d+)/)?.[1] || 3600);
  cachedGoogleJwks = payload.keys;
  googleJwksExpiresAt = Date.now() + Math.min(maxAge, 21600) * 1000;
  return cachedGoogleJwks;
}
async function verifyGoogleIdToken(token, nonce, env) {
  try {
    if (!env.GOOGLE_WEB_CLIENT_ID || !token || token.length > 10000 || !nonce) return null;
    const [encodedHeader, encodedClaims, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedClaims || !encodedSignature) return null;
    const header = decodeJwtPart(encodedHeader);
    const claims = decodeJwtPart(encodedClaims);
    if (!header || header.alg !== 'RS256' || !header.kid || !claims) return null;
    const jwk = (await googleSigningKeys()).find(key => key.kid === header.kid && key.alg === 'RS256');
    if (!jwk) return null;
    const publicKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const body = `${encodedHeader}.${encodedClaims}`;
    const validSignature = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, decode64url(encodedSignature), new TextEncoder().encode(body));
    const now = Math.floor(Date.now() / 1000);
    const verifiedEmail = claims.email_verified === true || claims.email_verified === 'true';
    if (!validSignature || !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) || claims.aud !== env.GOOGLE_WEB_CLIENT_ID ||
        !claims.sub || !claims.email || !verifiedEmail || claims.nonce !== nonce || !Number.isFinite(claims.exp) || claims.exp <= now ||
        (claims.iat && claims.iat > now + 60)) return null;
    return { sub: claims.sub, email: String(claims.email).toLowerCase(), name: String(claims.name || '').trim().slice(0, 80), exp: claims.exp };
  } catch (error) {
    console.error('Google identity validation failed:', error.message);
    return null;
  }
}

function pemBytes(pem) {
  return Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), c => c.charCodeAt(0));
}
async function googleAccessToken(env) {
  if (!env.PLAY_SERVICE_ACCOUNT_JSON) throw new Error('PLAY_NOT_CONFIGURED');
  const account = JSON.parse(env.PLAY_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const head = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = base64url(new TextEncoder().encode(JSON.stringify({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: account.token_uri, iat: now, exp: now + 3600 })));
  const content = `${head}.${claim}`;
  const key = await crypto.subtle.importKey('pkcs8', pemBytes(account.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const assertion = `${content}.${base64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(content)))}`;
  const response = await fetch(account.token_uri, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error('PLAY_AUTH_FAILED');
  return result.access_token;
}
function membershipExpiry(verified, productId) {
  const item = (verified.lineItems || []).find(entry => entry.productId === productId) || verified.lineItems?.[0];
  const parsed = Date.parse(item?.expiryTime || verified.expiryTime || '');
  if (Number.isFinite(parsed)) return parsed;
  const millis = Number(verified.expiryTimeMillis);
  return Number.isFinite(millis) ? millis : 0;
}
async function verifyPlaySubscription(env, accessToken, productId, purchaseToken) {
  const packageName = encodeURIComponent(env.PLAY_PACKAGE_NAME);
  const token = encodeURIComponent(purchaseToken);
  const v2 = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${token}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const v2Body = await v2.json();
  if (v2.ok) {
    const item = (v2Body.lineItems || []).find(entry => entry.productId === productId) || v2Body.lineItems?.[0];
    const expiry = membershipExpiry(v2Body, productId);
    const active = MEMBER_STATES.has(v2Body.subscriptionState) && expiry > Date.now() && (!item?.productId || item.productId === productId);
    return { active, expiry, productId: item?.productId || productId, needsAck: v2Body.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING', state: v2Body.subscriptionState || '', linkedPurchaseToken: v2Body.linkedPurchaseToken || '' };
  }
  const v1 = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${token}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const v1Body = await v1.json();
  if (!v1.ok) {
    if ([404, 410].includes(v1.status) || [404, 410].includes(v2.status)) return { active: false, expiry: 0, productId, needsAck: false, state: 'NOT_FOUND', linkedPurchaseToken: '' };
    return null;
  }
  const expiry = membershipExpiry(v1Body, productId);
  const active = [1, 2].includes(Number(v1Body.paymentState)) && expiry > Date.now();
  return { active, expiry, productId, needsAck: Number(v1Body.acknowledgementState) === 0, state: '', linkedPurchaseToken: v1Body.linkedPurchaseToken || '' };
}
async function acknowledgeSubscription(env, accessToken, productId, purchaseToken) {
  const response = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(env.PLAY_PACKAGE_NAME)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: '{}' });
  if (!response.ok) console.error('Google Play subscription acknowledgement pending.');
}
function sameSecret(a, b) {
  const left = new TextEncoder().encode(String(a));
  const right = new TextEncoder().encode(String(b));
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) diff |= (left[i] || 0) ^ (right[i] || 0);
  return diff === 0;
}
async function verifyPubSubPush(request, env, url) {
  if (!env.RTDN_TOKEN && !env.RTDN_AUDIENCE) return false;
  if (env.RTDN_TOKEN && !sameSecret(url.searchParams.get('token') || '', env.RTDN_TOKEN)) return false;
  if (!env.RTDN_AUDIENCE) return true;
  try {
    const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1] || '';
    const [encodedHeader, encodedClaims, encodedSignature] = token.split('.');
    const header = decodeJwtPart(encodedHeader || '');
    const claims = decodeJwtPart(encodedClaims || '');
    if (!header || header.alg !== 'RS256' || !claims || !encodedSignature) return false;
    const jwk = (await googleSigningKeys()).find(key => key.kid === header.kid && key.alg === 'RS256');
    if (!jwk) return false;
    const publicKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, decode64url(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`));
    const now = Math.floor(Date.now() / 1000);
    const verifiedEmail = claims.email_verified === true || claims.email_verified === 'true';
    return valid && ['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) && claims.aud === env.RTDN_AUDIENCE &&
      Number(claims.exp) > now && (!env.RTDN_SERVICE_ACCOUNT || (verifiedEmail && claims.email === env.RTDN_SERVICE_ACCOUNT));
  } catch (error) {
    console.error('Pub/Sub token validation failed:', error.message);
    return false;
  }
}
async function refreshUserMembership(env, accessToken, userId, known) {
  const rows = (await env.DB.prepare('SELECT purchase_token, product_id FROM purchases WHERE user_id = ? AND granted = 1 ORDER BY created_at DESC LIMIT 5').bind(userId).all()).results || [];
  let best = known?.active ? { expiry: known.expiry, productId: known.productId } : null;
  for (const row of rows) {
    if (row.purchase_token === known?.token) continue;
    const verified = await verifyPlaySubscription(env, accessToken, row.product_id, row.purchase_token);
    if (!verified) throw new Error('PLAY_LOOKUP_FAILED');
    if (verified.active && (!best || verified.expiry > best.expiry)) best = { expiry: verified.expiry, productId: verified.productId };
  }
  if (best) await env.DB.prepare('UPDATE users SET membership_until = ?, membership_product = ? WHERE id = ?').bind(best.expiry, best.productId, userId).run();
  else await env.DB.prepare('UPDATE users SET membership_until = MIN(membership_until, ?) WHERE id = ?').bind(Date.now(), userId).run();
}
async function rtdnRoute(request, env, url) {
  if (!env.DB || !env.PLAY_SERVICE_ACCOUNT_JSON || !env.PLAY_PACKAGE_NAME) return json({ error: 'Not configured' }, 503);
  if (!await verifyPubSubPush(request, env, url)) return json({ error: 'Unauthorized' }, 401);
  let notification;
  try {
    const envelope = await request.json();
    notification = JSON.parse(unb64text(String(envelope?.message?.data || '')));
  } catch { return json({ ok: true, ignored: 'malformed' }); }
  if (notification?.packageName !== env.PLAY_PACKAGE_NAME) return json({ ok: true, ignored: 'package' });
  if (notification.testNotification) return json({ ok: true, test: true });
  const subscription = notification.subscriptionNotification;
  const voided = notification.voidedPurchaseNotification;
  const purchaseToken = String(subscription?.purchaseToken || voided?.purchaseToken || '');
  if (!purchaseToken) return json({ ok: true, ignored: 'type' });
  try {
    const accessToken = await googleAccessToken(env);
    let row = await env.DB.prepare('SELECT user_id, product_id FROM purchases WHERE purchase_token = ?').bind(purchaseToken).first();
    const productId = String(subscription?.subscriptionId || row?.product_id || '');
    if (!MEMBERSHIP[productId]) return json({ ok: true, ignored: 'product' });
    const verified = voided ? { active: false, expiry: 0, productId, needsAck: false, linkedPurchaseToken: '' } : await verifyPlaySubscription(env, accessToken, productId, purchaseToken);
    if (!verified) return json({ error: 'Lookup failed' }, 500);
    if (!row && verified.linkedPurchaseToken) {
      const linked = await env.DB.prepare('SELECT user_id FROM purchases WHERE purchase_token = ?').bind(verified.linkedPurchaseToken).first();
      if (linked) {
        await env.DB.prepare('INSERT OR IGNORE INTO purchases (purchase_token,user_id,product_id,credits,granted,created_at) VALUES (?,?,?,0,1,?)')
          .bind(purchaseToken, linked.user_id, verified.productId, Date.now()).run();
        row = { user_id: linked.user_id, product_id: verified.productId };
      }
    }
    if (!row) return json({ ok: true, pending: true });
    if (verified.active && verified.needsAck) await acknowledgeSubscription(env, accessToken, verified.productId, purchaseToken);
    await refreshUserMembership(env, accessToken, row.user_id, { ...verified, token: purchaseToken });
    return json({ ok: true });
  } catch (error) {
    console.error('RTDN processing error:', error.message);
    return json({ error: 'Retry' }, 500);
  }
}
async function purchaseRoute(request, env, user) {
  if (!env.DB || !env.PLAY_SERVICE_ACCOUNT_JSON || !env.PLAY_PACKAGE_NAME) return json({ error: 'Pirkimų patikra dar nesukonfigūruota.' }, 503);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'Netinkami pirkimo duomenys.' }, 400); }
  const productId = String(input.productId || '');
  const purchaseToken = String(input.purchaseToken || '');
  if (!MEMBERSHIP[productId] || purchaseToken.length < 20 || purchaseToken.length > 4096) return json({ error: 'Nežinomas produktas arba netinkamas pirkimo žetonas.' }, 400);
  try {
    const accessToken = await googleAccessToken(env);
    const verified = await verifyPlaySubscription(env, accessToken, productId, purchaseToken);
    if (!verified?.active || verified.expiry <= Date.now()) return json({ error: '„Google Play“ nepavyko patvirtinti narystės.' }, 400);
    const existing = await env.DB.prepare('SELECT user_id FROM purchases WHERE purchase_token=?').bind(purchaseToken).first();
    if (existing && existing.user_id !== user.id) return json({ error: 'Šis pirkimas jau susietas su kita paskyra.' }, 409);
    await env.DB.batch([
      env.DB.prepare('INSERT OR IGNORE INTO purchases (purchase_token,user_id,product_id,credits,created_at) VALUES (?,?,?,?,?)')
        .bind(purchaseToken, user.id, productId, 0, Date.now()),
      env.DB.prepare('UPDATE purchases SET granted=1, product_id=? WHERE purchase_token=? AND user_id=?').bind(productId, purchaseToken, user.id),
      env.DB.prepare('UPDATE users SET membership_until=?, membership_product=? WHERE id=? AND membership_until < ?')
        .bind(verified.expiry, productId, user.id, verified.expiry)
    ]);
    const current = await env.DB.prepare('SELECT membership_until FROM users WHERE id=?').bind(user.id).first();
    if ((Number(current?.membership_until) || 0) < verified.expiry) {
      await env.DB.prepare('UPDATE users SET membership_until=?, membership_product=? WHERE id=?').bind(verified.expiry, productId, user.id).run();
    }
    if (verified.needsAck) await acknowledgeSubscription(env, accessToken, productId, purchaseToken);
    const balance = publicUser(await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id=?`).bind(user.id).first());
    return json({ ...balance, granted: true });
  } catch (error) {
    console.error('Purchase verification error:', error.message);
    return json({ error: 'Nepavyko patikrinti pirkimo. Narystė bus aktyvuota po patikros.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }});
    if (request.method === 'GET' && url.pathname === '/api/auth/config') return json({ googleWebClientId: env.GOOGLE_WEB_CLIENT_ID || '' });
    if (request.method === 'GET' || request.method === 'HEAD') {
      const legal = legalPage(url, env);
      if (legal) return legal;
      if (url.pathname === '/') return Response.redirect(new URL('/privacy', url).toString(), 302);
    }
    if (request.method !== 'POST') return json({ error: 'Not found' }, 404);
    if (url.pathname === '/api/play/rtdn') return rtdnRoute(request, env, url);
    if (url.pathname === '/api/auth/reset/request') return resetRequestRoute(request, env);
    if (url.pathname === '/api/auth/reset/confirm') return resetConfirmRoute(request, env);
    if (url.pathname === '/api/auth/register' || url.pathname === '/api/auth/login' || url.pathname === '/api/auth/google') return authRoute(request, env, url.pathname);
    if (!['/api/auth/balance', '/api/auth/password', '/api/auth/delete', '/api/purchase/verify', '/api/analyze-meal'].includes(url.pathname)) return json({ error: 'Not found' }, 404);
    if (!env.DB) return json({ error: 'Kreditų serveris dar nesukonfigūruotas.' }, 503);
    const user = await authenticatedUser(request, env);
    if (!user) return json({ error: 'Prisijunkite prie paskyros, kad galėtumėte naudoti nuotraukų analizę.' }, 401);
    if (url.pathname === '/api/auth/balance') return json(publicUser(user));
    if (url.pathname === '/api/auth/password') return passwordChangeRoute(request, env, user);
    if (url.pathname === '/api/auth/delete') return deleteAccountRoute(env, user);
    if (url.pathname === '/api/purchase/verify') return purchaseRoute(request, env, user);

    const now = Date.now();
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const recent = (hitsByIp.get(ip) || []).filter(ts => now - ts < WINDOW_MS);
    if (recent.length >= LIMIT_PER_IP) return json({ error: 'Per daug užklausų. Bandykite vėliau.' }, 429);
    recent.push(now); hitsByIp.set(ip, recent);
    if (!env.OPENAI_API_KEY) return json({ error: 'Serveryje nenustatytas OPENAI_API_KEY.' }, 503);
    const member = hasMembership(user);
    let usedCredit = false;
    if (!member) {
      const debit = await env.DB.prepare('UPDATE users SET credits=credits-1 WHERE id=? AND credits>0').bind(user.id).run();
      if (!debit.meta?.changes) return json({ error: 'Nemokamos analizės baigėsi. Pasirinkite narystę, kad galėtumėte tęsti.', credits: 0, needsCredits: true, member: false }, 402);
      usedCredit = true;
    }
    let payload;
    const refund = async () => { if (usedCredit) await env.DB.prepare('UPDATE users SET credits=credits+1 WHERE id=?').bind(user.id).run(); };
    try { payload = await request.json(); } catch { await refund(); return json({ error: 'Netinkami duomenys.' }, 400); }
    const match = typeof payload?.imageDataUrl === 'string' && payload.imageDataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match || Math.floor(match[2].length * 3 / 4) > MAX_IMAGE_BYTES) {
      await refund();
      return json({ error: 'Pateikite JPG, PNG arba WebP nuotrauką iki 5 MB.' }, 400);
    }
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: env.OPENAI_VISION_MODEL || MODEL_DEFAULT, store: false,
          instructions: 'Estimate the visible foods and portion sizes from this image. Return only estimates, never medical advice, glucose interpretation, insulin dose, correction, or dose adjustment. Macronutrients are totals for each estimated visible portion and are approximate. If food identity, hidden ingredients, or portion size is unclear, state uncertainty and lower confidence. Glycemic index is not visually measurable: return null unless the food can be identified specifically enough to provide a typical published food-level estimate; always state that it depends on variety, ripeness and preparation. Do not imply GI is measured from the image. Use the requested language for food names and notes.',
          input: [{ role: 'user', content: [
            { type: 'input_text', text: `Analyze this meal photo. Respond in ${LANGUAGE_NAMES[payload.language] || 'English'}. Give separate visible components where practical. Estimate edible portion grams, total carbohydrates, protein and fat for each component.` },
            { type: 'input_image', image_url: payload.imageDataUrl, detail: 'high' }
          ] }], text: { format: { type: 'json_schema', name: 'meal_photo_estimate', strict: true, schema } }
        })
      });
      const apiResult = await response.json();
      if (!response.ok) { await refund(); console.error('OpenAI request failed', response.status, apiResult.error?.code || 'unknown'); return json({ error: 'Maisto analizė nepavyko. Bandykite dar kartą.' }, 502); }
      const outputText = apiResult.output?.flatMap(x => x.content || []).find(x => x.type === 'output_text')?.text;
      const result = outputText && JSON.parse(outputText);
      if (!validResult(result)) { await refund(); return json({ error: 'Gautas netinkamas analizės formatas.' }, 502); }
      const balance = publicUser(await env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id=?`).bind(user.id).first());
      return json({ ...result, estimated: true, requiresConfirmation: true, ...balance });
    } catch (error) {
      await refund();
      console.error('Meal analysis error:', error.message);
      return json({ error: 'Nepavyko prisijungti prie analizės paslaugos.' }, 502);
    }
  }
};
