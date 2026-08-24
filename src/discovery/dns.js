import dns from 'node:dns/promises';

const timeout = Number(process.env.KYROXE_DNS_TIMEOUT || 5000);
async function resolves(hostname) {
  try {
    await Promise.race([dns.resolveAny(hostname), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))]);
    return true;
  } catch { return false; }
}

export async function discoverDns(candidates) {
  const concurrency = Math.max(1, Number(process.env.KYROXE_DNS_CONCURRENCY || 8));
  const found = [];
  for (let index = 0; index < candidates.length; index += concurrency) {
    const batch = candidates.slice(index, index + concurrency);
    const results = await Promise.all(batch.map(async (hostname) => ({ hostname, found: await resolves(hostname) })));
    found.push(...results.filter((item) => item.found).map((item) => item.hostname));
  }
  return found;
}
