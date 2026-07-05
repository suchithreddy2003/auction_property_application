// Cloudflare R2 storage helpers. Uses AWS Signature V4 directly so we don't
// depend on the heavyweight @aws-sdk just to upload and sign URLs.
//
// In development without R2 configured, falls back to a local on-disk store
// under .uploads/ so document upload still works end-to-end.

import { createHash, createHmac, randomBytes } from 'crypto';
import { mkdir, writeFile, readFile, stat } from 'fs/promises';
import path from 'node:path';
import { storageEnabled } from '@/lib/env';

export type UploadedObject = {
  key: string;
  size: number;
  contentType: string;
};

const LOCAL_ROOT = path.join(process.cwd(), '.uploads');

function r2Endpoint(): string {
  const acct = process.env.R2_ACCOUNT_ID!;
  return `https://${acct}.r2.cloudflarestorage.com`;
}

function r2Region(): string {
  return 'auto';
}

function bucket(): string {
  return process.env.R2_BUCKET || 'auction-docs';
}

export function newObjectKey(prefix: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 100);
  const rand = randomBytes(8).toString('hex');
  const ts = Date.now();
  return `${prefix}/${ts}-${rand}-${safe}`;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<UploadedObject> {
  if (!storageEnabled()) {
    const full = path.join(LOCAL_ROOT, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
    return { key, size: body.length, contentType };
  }

  const host = `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `${r2Endpoint()}/${bucket()}/${encodeKey(key)}`;
  const headers = await signedRequestHeaders('PUT', url, body, contentType, host);
  const res = await fetch(url, { method: 'PUT', headers, body: new Uint8Array(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`R2 upload failed ${res.status}: ${text.slice(0, 200)}`);
  }
  return { key, size: body.length, contentType };
}

export async function readLocalObject(key: string): Promise<{ buf: Buffer; size: number }> {
  const full = path.join(LOCAL_ROOT, key);
  const buf = await readFile(full);
  const s = await stat(full);
  return { buf, size: s.size };
}

export async function localObjectExists(key: string): Promise<boolean> {
  try {
    await stat(path.join(LOCAL_ROOT, key));
    return true;
  } catch {
    return false;
  }
}

// Presign a GET URL valid for `ttlSeconds`. Caller is responsible for the
// authorization check before producing the URL.
export async function getSignedDownloadUrl(key: string, ttlSeconds = 300): Promise<string> {
  if (!storageEnabled()) {
    // Local dev — return our own proxy URL that reads from disk.
    return `/api/documents/local/${encodeURIComponent(key)}`;
  }
  const host = `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const date = isoDateStamp();
  const stamp = isoTimestamp();
  const credential = `${process.env.R2_ACCESS_KEY_ID}/${date}/${r2Region()}/s3/aws4_request`;
  const params = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': stamp,
    'X-Amz-Expires': String(ttlSeconds),
    'X-Amz-SignedHeaders': 'host',
  });
  const canonicalUri = `/${bucket()}/${encodeKey(key)}`;
  const canonicalQuery = sortedQuery(params);
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    stamp,
    `${date}/${r2Region()}/s3/aws4_request`,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await deriveSigningKey(date);
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  params.set('X-Amz-Signature', signature);
  return `${r2Endpoint()}${canonicalUri}?${sortedQuery(params)}`;
}

async function signedRequestHeaders(
  method: string,
  url: string,
  body: Buffer,
  contentType: string,
  host: string
): Promise<Record<string, string>> {
  const date = isoDateStamp();
  const stamp = isoTimestamp();
  const payloadHash = sha256Hex(body);
  const parsed = new URL(url);
  const canonicalUri = parsed.pathname;
  const canonicalQuery = parsed.searchParams.toString();
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${stamp}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    stamp,
    `${date}/${r2Region()}/s3/aws4_request`,
    sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = await deriveSigningKey(date);
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const credential = `${process.env.R2_ACCESS_KEY_ID}/${date}/${r2Region()}/s3/aws4_request`;
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return {
    'Content-Type': contentType,
    Host: host,
    'X-Amz-Content-Sha256': payloadHash,
    'X-Amz-Date': stamp,
    Authorization: authorization,
  };
}

async function deriveSigningKey(date: string): Promise<Buffer> {
  const kSecret = `AWS4${process.env.R2_SECRET_ACCESS_KEY}`;
  const kDate = createHmac('sha256', kSecret).update(date).digest();
  const kRegion = createHmac('sha256', kDate).update(r2Region()).digest();
  const kService = createHmac('sha256', kRegion).update('s3').digest();
  return createHmac('sha256', kService).update('aws4_request').digest();
}

function encodeKey(key: string): string {
  return key.split('/').map((p) => encodeURIComponent(p)).join('/');
}

function sortedQuery(params: URLSearchParams): string {
  const pairs: Array<[string, string]> = [];
  params.forEach((v, k) => pairs.push([k, v]));
  pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return pairs
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

function isoDateStamp(d = new Date()): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function isoTimestamp(d = new Date()): string {
  return d.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function sha256Hex(input: Buffer | string): string {
  return createHash('sha256').update(input).digest('hex');
}
