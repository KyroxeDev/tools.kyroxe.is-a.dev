import dns from 'node:dns/promises';

export const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA', 'SRV'];

const timeout = Number(process.env.KYROXE_DNS_TIMEOUT || 5000);

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('DNS query timed out'), { code: 'ETIMEOUT' })), timeout))
  ]);
}

async function resolveType(hostname, type) {
  const values = await withTimeout(dns.resolve(hostname, type));
  return values.map((value) => {
    if (typeof value === 'string') return value;
    if (type === 'MX') return { priority: value.priority, exchange: value.exchange };
    if (type === 'SOA') return value;
    if (type === 'CAA') return { flags: value.critical, tag: value.issue || value.tag, value: value.value };
    if (type === 'SRV') return value;
    return value;
  });
}

export async function lookupRecords(hostname, types = RECORD_TYPES) {
  const records = Object.fromEntries(types.map((type) => [type, []]));
  const errors = [];
  await Promise.all(types.map(async (type) => {
    try {
      records[type] = await resolveType(hostname, type);
    } catch (error) {
      if (!['ENODATA', 'ENOTFOUND'].includes(error.code)) errors.push({ type, code: error.code || 'UNKNOWN' });
    }
  }));
  return { records, errors };
}

export async function lookupPtr(hostname) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return [];
  try { return await withTimeout(dns.reverse(hostname)); } catch { return []; }
}
