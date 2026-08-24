import { isValidHostname } from '../dns/lookup.js';

const builtIn = ['www', 'api', 'mail', 'smtp', 'imap', 'ftp', 'dev', 'test', 'staging', 'status', 'app', 'cdn', 'blog', 'docs', 'admin', 'portal'];

export function getWordlist() {
  const configured = process.env.KYROXE_WORDLIST;
  const values = configured ? configured.split(',').map((item) => item.trim().toLowerCase()) : builtIn;
  return [...new Set(values)].filter((item) => isValidHostname(`${item}.example.com`) && !item.includes('.')).slice(0, 50);
}

export function wordlistCandidates(root) { return getWordlist().map((label) => `${label}.${root}`); }
