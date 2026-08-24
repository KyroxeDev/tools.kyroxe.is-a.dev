import { isValidHostname, normalizeHostname, lookupHost } from '../../src/dns/lookup.js';
import { discoverSubdomains } from '../../src/discovery/index.js';
import { formatTerminal, formatErrorTerminal } from '../../src/formatters/terminal.js';

const clients = new Map();
const windowMs = 60_000;
const requestLimit = Number(process.env.KYROXE_RATE_LIMIT || 60);

function response(statusCode, body, terminal = false) {
  return { statusCode, headers: { 'content-type': terminal ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'cache-control': 'no-store' }, body: terminal ? body : JSON.stringify(body) };
}

function getDomain(event) {
  const path = event.path.replace(/\/$/, '');
  const encoded = path.slice(path.lastIndexOf('/') + 1);
  return normalizeHostname(decodeURIComponent(event.queryStringParameters?.domain || encoded));
}

export async function handler(event) {
  const terminal = event.queryStringParameters?.format === 'terminal';
  const client = event.headers?.['x-nf-client-connection-ip'] || event.headers?.['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const entry = clients.get(client);
  if (!entry || now - entry.started >= windowMs) clients.set(client, { started: now, count: 1 });
  else if (++entry.count > requestLimit) return response(429, terminal ? formatErrorTerminal('unknown', 'Rate limit exceeded', 429) : { success: false, error: 'Rate limit exceeded' }, terminal);

  const raw = getDomain(event);
  if (!isValidHostname(raw)) return response(400, terminal ? formatErrorTerminal(raw, 'Invalid hostname') : { success: false, error: 'Invalid hostname', target: raw }, terminal);
  try {
    const root = await lookupHost(raw);
    const discovery = await discoverSubdomains(raw);
    const subdomains = await Promise.all(discovery.hosts.map((host) => lookupHost(host)));
    const payload = { success: true, target: raw, records: root.records, ptr: root.ptr, subdomains: subdomains.map(({ hostname, records, ptr, resolved }) => ({ hostname, records, ptr, resolved })), discovery: discovery.sources };
    if (!discovery.sources.certificateTransparency) payload.warning = 'Certificate Transparency discovery was unavailable.';
    return response(200, terminal ? formatTerminal(payload) : payload, terminal);
  } catch (error) {
    const reason = error.code === 'ETIMEOUT' ? 'DNS query timed out' : error.message || 'Lookup failed';
    return response(502, terminal ? formatErrorTerminal(raw, reason, 502) : { success: false, error: reason, target: raw }, terminal);
  }
}
