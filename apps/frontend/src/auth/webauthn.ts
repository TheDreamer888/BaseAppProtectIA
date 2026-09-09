/** Thin wrapper around the WebAuthn browser API (passkeys / USB security keys). */

function b64urlToBuffer(b64url: string): ArrayBuffer {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(b64url.length + ((4 - (b64url.length % 4)) % 4), "=");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isPasskeySupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

export async function createPasskey(optionsJson: string) {
  const options = JSON.parse(optionsJson);
  options.publicKey.challenge = b64urlToBuffer(options.publicKey.challenge);
  options.publicKey.user.id = b64urlToBuffer(options.publicKey.user.id);
  for (const cred of options.publicKey.excludeCredentials ?? []) {
    cred.id = b64urlToBuffer(cred.id);
  }
  const credential = (await navigator.credentials.create(options)) as PublicKeyCredential;
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: bufferToB64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToB64url(response.clientDataJSON),
      attestationObject: bufferToB64url(response.attestationObject),
    },
  };
}

export async function getPasskeyAssertion(optionsJson: string) {
  const options = JSON.parse(optionsJson);
  options.publicKey.challenge = b64urlToBuffer(options.publicKey.challenge);
  for (const cred of options.publicKey.allowCredentials ?? []) {
    cred.id = b64urlToBuffer(cred.id);
  }
  const credential = (await navigator.credentials.get(options)) as PublicKeyCredential;
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToB64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToB64url(response.clientDataJSON),
      authenticatorData: bufferToB64url(response.authenticatorData),
      signature: bufferToB64url(response.signature),
      userHandle: response.userHandle ? bufferToB64url(response.userHandle) : null,
    },
  };
}
