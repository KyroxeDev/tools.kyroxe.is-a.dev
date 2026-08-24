import { isValidHostname } from '../dns/lookup.js';

export async function discoverCrt(root) {
  const url = `https://crt.sh/?q=%25.${encodeURIComponent(root)}&output=json`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(Number(process.env.KYROXE_DNS_TIMEOUT || 5000)), headers: { accept: 'application/json' } });
    if (!response.ok) return { hosts: [], available: false };
    const certificates = await response.json();
    const hosts = certificates.flatMap((certificate) => String(certificate.name_value || '').split('\n'))
      .map((host) => host.trim().toLowerCase().replace(/^\*\./, '').replace(/\.$/, ''))
      .filter((host) => isValidHostname(host) && host !== root && host.endsWith(`.${root}`));
    return { hosts: [...new Set(hosts)], available: true };
  } catch { return { hosts: [], available: false }; }
}
