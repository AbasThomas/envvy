import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

type EncryptedPayload = {
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  data: string;
};

function getKey(secret?: string) {
  const source =
    secret ??
    process.env.ENCRYPTION_MASTER_KEY ??
    process.env.NEXTAUTH_SECRET ??
    "envii-dev-master-key";

  return createHash("sha256").update(source).digest();
}

export function encryptString(value: string, secret?: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function decryptString(payloadBase64: string, secret?: string) {
  const raw = Buffer.from(payloadBase64, "base64").toString("utf8");
  const payload = JSON.parse(raw) as EncryptedPayload;

  if (payload.alg !== "aes-256-gcm") {
    throw new Error("Unsupported encryption algorithm");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(secret),
    Buffer.from(payload.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function encryptJson(payload: Record<string, string>, secret?: string) {
  return encryptString(JSON.stringify(payload), secret);
}

export function decryptJson(payloadBase64: string, secret?: string) {
  return JSON.parse(decryptString(payloadBase64, secret)) as Record<string, string>;
}

export function createApiToken() {
  return randomBytes(32).toString("hex");
}
