import crypto from "crypto";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";

function getSecret(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    throw new Error(
      "ADMIN_PASSWORD ist nicht gesetzt. Bitte in Vercel unter Settings → Environment Variables eintragen."
    );
  }
  return pw;
}

export function computeSessionToken(): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update("feedback-app-admin-session")
    .digest("hex");
}

export function checkPassword(candidate: string): boolean {
  const secret = getSecret();
  const a = Buffer.from(candidate);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAdminRequest(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  try {
    return cookie === computeSessionToken();
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

// Erzeugt einen nicht erratbaren, nicht sprechenden Link-Schlüssel
// für ein neues Feedback-Thema.
export function generateLinkKey(): string {
  return crypto.randomBytes(9).toString("base64url"); // z.B. "kQ3f7z9XpN2"
}
