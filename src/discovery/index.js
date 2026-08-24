import { normalizeHostname } from '../dns/lookup.js';
import { wordlistCandidates } from './wordlist.js';
import { discoverDns } from './dns.js';
import { discoverCrt } from './crt.js';

export async function discoverSubdomains(root) {
  const target = normalizeHostname(root);
  const limit = Math.max(0, Number(process.env.KYROXE_DISCOVERY_LIMIT || 100));
  const crt = await discoverCrt(target);
  const candidates = [...new Set([...crt.hosts, ...wordlistCandidates(target)])].slice(0, limit);
  const resolved = await discoverDns(candidates);
  return { hosts: resolved.slice(0, limit), sources: { certificateTransparency: crt.available, dnsWordlist: true } };
}
