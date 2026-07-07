const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

async function getKey(): Promise<CryptoKey> {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }

  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(raw)
  );

  return crypto.subtle.importKey(
    "raw", keyData, { name: ALGORITHM }, false, ["encrypt", "decrypt"]
  );
}

export async function encrypt(text: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv }, key, encoded
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return Buffer.from(combined).toString("base64");
}

export async function decrypt(encryptedData: string): Promise<string> {
  const key = await getKey();
  const combined = Buffer.from(encryptedData, "base64");
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv }, key, data
  );

  return new TextDecoder().decode(decrypted);
}
