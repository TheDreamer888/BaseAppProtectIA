/**
 * Encrypted, non-readable local cache for non-sensitive session data
 * (profile snapshot, linked-methods list, "remember this device" flag).
 *
 * Real session tokens NEVER live here — they are httpOnly cookies set by the
 * backend, so JavaScript (and therefore this file) never has access to them
 * at all. This store only avoids caching the profile in plaintext.
 *
 * The AES-GCM key is generated with `extractable: false`, so no code —
 * including this module itself — can ever export its raw bytes; it can only
 * be used, via the SubtleCrypto handle, to encrypt/decrypt. That is the
 * "encriptado, eu não posso ver" property applied to client-side storage.
 */

const DB_NAME = "protectia-secure-store";
const STORE_NAME = "kv";
const KEY_ID = "device-key";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let cachedKeyPromise: Promise<CryptoKey> | null = null;

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  if (cachedKeyPromise) return cachedKeyPromise;
  cachedKeyPromise = (async () => {
    const db = await openDb();
    const existing = await idbGet<CryptoKey>(db, KEY_ID);
    if (existing) return existing;
    // extractable: false -> raw key material is unreadable to any JS, forever.
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);
    await idbSet(db, KEY_ID, key);
    return key;
  })();
  return cachedKeyPromise;
}

export async function secureSet(key: string, value: unknown): Promise<void> {
  const cryptoKey = await getOrCreateDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, plaintext);
  const db = await openDb();
  await idbSet(db, `data:${key}`, { iv, ciphertext });
}

export async function secureGet<T>(key: string): Promise<T | undefined> {
  const cryptoKey = await getOrCreateDeviceKey();
  const db = await openDb();
  const record = await idbGet<{ iv: Uint8Array; ciphertext: ArrayBuffer }>(db, `data:${key}`);
  if (!record) return undefined;
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: record.iv },
      cryptoKey,
      record.ciphertext,
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    return undefined;
  }
}

export async function secureClear(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
