import dns from 'node:dns/promises';
import { lookupRecords, lookupPtr } from './records.js';

export function isValidHostname(hostname) {
  if (typeof hostname !== 'string' || hostname.length > 253) return false;
  const value = hostname.replace(/\.$/, '').toLowerCase();
  if (!value || value.includes('..') || value.includes('/') || value.includes('\\') || value.includes(':')) return false;
  return value.split('.').every((label) => label.length >= 1 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
}

export function normalizeHostname(hostname) { return hostname.trim().replace(/\.$/, '').toLowerCase(); }

export async function lookupHost(hostname) {
  const target = normalizeHostname(hostname);
  let addresses;
  try { addresses = await Promise.race([dns.lookup(target, { all: true }), new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('DNS lookup timed out'), { code: 'ETIMEOUT' })), Number(process.env.KYROXE_DNS_TIMEOUT || 5000)))]); }
  catch (error) { addresses = []; }
  const result = await lookupRecords(target);
  const hasRecords = Object.values(result.records).some((values) => values.length > 0);
  return { hostname: target, records: result.records, ptr: await lookupPtr(target), resolved: addresses.length > 0 || hasRecords, errors: result.errors };
}
