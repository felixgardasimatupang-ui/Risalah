function base32Encode(buffer: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += chars[(value >> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += chars[(value << (5 - bits)) & 31];
  }

  return result;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toBufferSource(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

async function generateHmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", toBufferSource(key), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, toBufferSource(message));
  return new Uint8Array(signature);
}

function dynamicTruncate(hmac: Uint8Array): number {
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return code;
}

export function createSecret(length: number = 20): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
}

export function generateTOTPUri(options: {
  secret: string;
  email: string;
  issuer: string;
  digits?: number;
  period?: number;
}): string {
  const { secret, email, issuer, digits = 6, period = 30 } = options;
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${digits}&period=${period}`;
}

export async function verifyTOTP(options: {
  secret: string;
  token: string;
  window?: number;
}): Promise<boolean> {
  const { secret, token, window = 1 } = options;
  const period = 30;
  const digits = 6;
  const currentTime = Math.floor(Date.now() / 1000);
  const counter = Math.floor(currentTime / period);

  for (let i = -window; i <= window; i++) {
    const expected = await generateTOTP(secret, counter + i, digits);
    if (expected === token) return true;
  }

  return false;
}

async function generateTOTP(secret: string, counter: number, digits: number): Promise<string> {
  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter >>= 8;
  }

  const key = base32Decode(secret);
  const hmac = await generateHmacSha1(key, counterBytes);
  const code = dynamicTruncate(hmac);
  const token = code % Math.pow(10, digits);
  return token.toString().padStart(digits, "0");
}

function base32Decode(encoded: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = encoded.replace(/[^A-Z2-7]/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleaned) {
    value = (value << 5) | chars.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}
