const form = document.querySelector('#lookup-form');
const input = document.querySelector('#domain');
const results = document.querySelector('#results');
const target = document.querySelector('#target');
const records = document.querySelector('#records');
const subdomains = document.querySelector('#subdomains');
const message = document.querySelector('#message');
const count = document.querySelector('#count');
const escapeHtml = (value) => String(value).replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' }[char]));
const showValue = (value) => escapeHtml(typeof value === 'string' ? value : JSON.stringify(value));
const renderRecords = (recordSet) => Object.entries(recordSet || {}).flatMap(([type, values]) => values.map((value) => `<div class="record"><strong>${type}</strong><span>${showValue(value)}</span></div>`)).join('');
form.addEventListener('submit', async (event) => {
  event.preventDefault(); const domain = input.value.trim(); if (!domain) return;
  results.hidden = false; target.textContent = domain; records.innerHTML = '<p class="empty">Querying public DNS...</p>'; subdomains.innerHTML = ''; message.textContent = '';
  try {
    const response = await fetch(`/v1/dns/${encodeURIComponent(domain)}`); const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Lookup failed');
    target.textContent = data.target; records.innerHTML = renderRecords(data.records) || '<p class="empty">No records returned.</p>'; count.textContent = `(${data.subdomains.length})`;
    subdomains.innerHTML = data.subdomains.map((item) => { const itemRecords = renderRecords(item.records); return `<div class="host"><strong>${escapeHtml(item.hostname)}</strong>${itemRecords || '<span>Resolved host · no supported records</span>'}</div>`; }).join('') || '<p class="empty">No DNS-resolvable subdomains discovered.</p>';
    if (data.warning) message.textContent = data.warning;
    document.querySelector('#copy-link').onclick = async () => { await navigator.clipboard.writeText(`${location.origin}/v1/dns/${encodeURIComponent(data.target)}`); message.textContent = 'API URL copied.'; };
  } catch (error) { message.textContent = error.message; records.innerHTML = ''; }
});
