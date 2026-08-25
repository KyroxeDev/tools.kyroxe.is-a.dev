const blue = '\x1b[34m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const gray = '\x1b[90m';
const reset = '\x1b[0m';
const color = (value, code, enabled) => enabled ? `${code}${value}${reset}` : value;
const display = (value) => typeof value === 'string' ? value : JSON.stringify(value);

export function formatTerminal(data, { colors = true } = {}) {
  const lines = [];
  lines.push(color('╔══════════════════════════════════════════════╗', blue, colors));
  lines.push(color('║              KYROXE DNS                     ║', blue, colors));
  lines.push(color('╚══════════════════════════════════════════════╝', blue, colors), '');
  lines.push(color('DNS LOOKUP', blue, colors), '==========', '', 'Target', '------', data.target, '');
  lines.push(color('DNS RECORDS', blue, colors), '-----------', '');
  for (const [type, values] of Object.entries(data.records || {})) {
    lines.push(color(type, blue, colors));
    lines.push(...(values.length ? values.map((value) => `  ${display(value)}`) : [`  ${color('No records', gray, colors)}`]), '');
  }
  lines.push(color('DISCOVERED SUBDOMAINS', blue, colors), '---------------------', '');
  if (data.subdomains?.length) {
    for (const item of data.subdomains) {
      lines.push(color(item.hostname, green, colors));
      const values = Object.entries(item.records || {}).flatMap(([type, records]) => records.map((record) => `${type} -> ${display(record)}`));
      lines.push(...(values.length ? values.map((value) => `  ${value}`) : ['  No records']), '');
    }
    lines.push(color(`Found ${data.subdomains.length} discovered subdomain${data.subdomains.length === 1 ? '' : 's'}.`, green, colors));
  } else lines.push(color('No DNS-resolvable subdomains discovered.', yellow, colors));
  if (data.warning) lines.push('', color(`Warning: ${data.warning}`, yellow, colors));
  return lines.join('\n');
}

export function formatErrorTerminal(target, reason, status = 400) {
  return formatTerminal({ target, records: {}, subdomains: [], warning: `${status >= 500 ? 'Upstream service unavailable' : 'DNS lookup failed'}: ${reason}` });
}
