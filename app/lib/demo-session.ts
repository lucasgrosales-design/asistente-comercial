import crypto from "node:crypto";

function demoSecret() {
  return process.env.DEMO_SESSION_SECRET || null;
}

function signPayload(payload: string) {
  const secret = demoSecret();
  if (!secret) throw new Error("demo_session_secret_not_configured");
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createDemoCookieValue(sessionId: string, expiresAt: number) {
  const payload = `${sessionId}.${expiresAt}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyDemoCookieValue(value?: string | null) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [sessionId, expiresRaw, signature] = parts;
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;
  const payload = `${sessionId}.${expiresAt}`;
  const expected = signPayload(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { sessionId, expiresAt };
}
