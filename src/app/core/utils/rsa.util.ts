import JSEncrypt from 'jsencrypt';

function normalizePemInput(raw: string): string {
  return raw
    .trim()
    .replace(/^"+|"+$/g, '')
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '');
}

function toPemPublicKey(raw: string): string {
  const normalized = normalizePemInput(raw);
  const base64 = normalized
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
    .replace(/-----END RSA PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');

  if (base64.length < 100) {
    throw new Error('Invalid RSA public key');
  }

  const lines = base64.match(/.{1,64}/g)?.join('\n') ?? base64;
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

export function encryptWithRsaPublicKey(plainText: string, publicKey: string): string {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(toPemPublicKey(publicKey));
  const encrypted = encryptor.encrypt(plainText);
  if (!encrypted) {
    throw new Error('RSA encryption failed');
  }
  return encrypted;
}
