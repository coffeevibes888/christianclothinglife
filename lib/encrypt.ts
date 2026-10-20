import bcrypt from 'bcryptjs';

const encoder = new TextEncoder();
const baseKey = process.env.ENCRYPTION_KEY || '';
const hmacKeyBytes = new TextEncoder().encode(baseKey);

const BCRYPT_ROUNDS = 12;

// Legacy (pre-bcrypt) unsalted HMAC hashing. Kept ONLY so existing passwords
// still verify until the user next signs in and is transparently upgraded to
// bcrypt (see `needsRehash` + the rehash step in auth.ts).
const legacyHmacHash = async (plainPassword: string): Promise<string> => {
  const passwordData = encoder.encode(plainPassword);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    hmacKeyBytes,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign', 'verify']
  );

  const hashBuffer = await crypto.subtle.sign('HMAC', cryptoKey, passwordData);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const isBcryptHash = (value: string) => /^\$2[aby]\$/.test(value);

// Hash a new password with bcrypt (per-password salt, slow by design).
export const hash = async (plainPassword: string): Promise<string> => {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
};

// Verify a password against a bcrypt hash (current) or the legacy HMAC hash.
export const compare = async (
  plainPassword: string,
  storedHash: string
): Promise<boolean> => {
  if (!storedHash) return false;

  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(plainPassword, storedHash);
  }

  // Legacy path: constant-time comparison of the old HMAC digest.
  const legacy = await legacyHmacHash(plainPassword);
  if (legacy.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < legacy.length; i++) {
    diff |= legacy.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
};

// True when a stored hash is still in the legacy format and should be upgraded
// to bcrypt the next time we have the plaintext (i.e. on successful login).
export const needsRehash = (storedHash: string): boolean => !isBcryptHash(storedHash);
const aesKeyLength = 32;

const getAesKeyBytes = () => {
  const raw = new TextEncoder().encode(baseKey);
  if (raw.length === aesKeyLength) return raw;
  if (raw.length > aesKeyLength) return raw.slice(0, aesKeyLength);
  const padded = new Uint8Array(aesKeyLength);
  padded.set(raw);
  return padded;
};

const getAesKey = async () => {
  const keyBytes = getAesKeyBytes();
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
};

export const encryptField = async (value: string): Promise<string> => {
  if (!value) return value;
  const key = await getAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = encoder.encode(value);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const encryptedBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv);
  combined.set(encryptedBytes, iv.length);
  return Buffer.from(combined).toString('base64');
};

export const decryptField = async (value: string | null): Promise<string> => {
  if (!value) return '';
  try {
    const key = await getAesKey();
    const combined = new Uint8Array(Buffer.from(value, 'base64'));
    if (combined.length <= 12) return value;
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return typeof value === 'string' ? value : '';
  }
};
// // Use Web Crypto API compatible with Edge Functions

// const encoder = new TextEncoder();
// const salt = crypto.getRandomValues(new Uint8Array(16)).join('');

// // Hash function
// export const hash = async (plainPassword: string): Promise<string> => {
//   const passwordData = encoder.encode(plainPassword + salt);
//   const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
//   return Array.from(new Uint8Array(hashBuffer))
//     .map((b) => b.toString(16).padStart(2, '0'))
//     .join('');
// };

// // Compare function
// export const compare = async (
//   plainPassword: string,
//   encryptedPassword: string
// ): Promise<boolean> => {
//   const hashedPassword = await hash(plainPassword);
//   return hashedPassword === encryptedPassword;
// };
