const encoder = new TextEncoder();

function demoSecret() {
  return process.env.DEMO_SESSION_SECRET || null;
}

async function signPayload(payload: string) {
  const secret = demoSecret();
  if (!secret) throw new Error("demo_session_secret_not_configured");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Buffer.from(signature).toString("base64url");
}

export async function createDemoCookieValue(sessionId: string, expiresAt: number) {
  const payload = `${sessionId}.${expiresAt}`;
  return `${payload}.${await signPayload(payload)}`;
}

export async function verifyDemoCookieValue(value?: string | null) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [sessionId, expiresRaw, signature] = parts;
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;
  const secret = demoSecret();
  if (!secret) return null;
  const payload = `${sessionId}.${expiresAt}`;
  try {
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["verify"]);
    const bytes = Buffer.from(signature, "base64url");
    const valid = await crypto.subtle.verify("HMAC", key, bytes, encoder.encode(payload));
    return valid ? {sessionId, expiresAt} : null;
  } catch {
    return null;
  }
}
