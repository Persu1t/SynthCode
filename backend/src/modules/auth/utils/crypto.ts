import {
  createHmac,
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString('base64url')}:${derivedKey.toString('base64url')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, saltValue, keyValue] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !saltValue || !keyValue) return false;

  const expected = Buffer.from(keyValue, 'base64url');
  const actual = (await scrypt(password, Buffer.from(saltValue, 'base64url'), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  jti?: string;
  iat: number;
  exp: number;
}

export function signToken(
  payload: Omit<TokenPayload, 'iat' | 'exp' | 'type'> & { type: 'access' | 'refresh' },
  secret: string,
  ttlSeconds: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64Url(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds }));
  const unsigned = `${header}.${body}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

export function verifyToken(token: string, secret: string): TokenPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const [header, body, signature] = parts;
  const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('Invalid token signature');
  }

  const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
  if (parsedHeader.alg !== 'HS256') throw new Error('Unsupported token algorithm');

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
  if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired or invalid');
  }
  return payload;
}

export const AUTH_TOKEN_TTL = {
  access: ACCESS_TOKEN_TTL_SECONDS,
  refresh: REFRESH_TOKEN_TTL_SECONDS,
};
