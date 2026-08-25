# Kyroxe DNS

My tools for anyone to use. Kyroxe DNS is a Netlify-hosted web app and serverless API for real public DNS lookups and bounded subdomain discovery.

## Deploy to Netlify

Connect this repository in Netlify. The included `netlify.toml` publishes `public/` and deploys `netlify/functions/` automatically. No server, database, installer, or systemd setup is required.

The public routes are:

- `/` - browser lookup interface
- `/v1/dns/:domain` - JSON API
- `/v1/dns/:domain?format=terminal` - terminal output
- `/health` - service health check

Set these optional Netlify environment variables under Site configuration > Environment variables: `KYROXE_RATE_LIMIT`, `KYROXE_DISCOVERY_LIMIT`, `KYROXE_DNS_TIMEOUT`, `KYROXE_DNS_CONCURRENCY`, and `KYROXE_WORDLIST`.

## Local fallback

```sh
npm install
npm run dev
# http://localhost:9999
```

```sh
curl http://localhost:9999/v1/dns/example.com
curl 'http://localhost:9999/v1/dns/example.com?format=terminal'
```

## Configuration

`KYROXE_HOST` defaults to `0.0.0.0`; `KYROXE_PORT` to `9999`; `KYROXE_RATE_LIMIT` to `60` requests/minute/IP; `KYROXE_DISCOVERY_LIMIT` to `100`; `KYROXE_DNS_TIMEOUT` to `5000` ms. `KYROXE_WORDLIST` accepts a comma-separated list of labels.

The API queries A, AAAA, CNAME, MX, NS, TXT, SOA, CAA, and SRV records. PTR is included for IPv4 targets. Discovery combines Certificate Transparency with a small common-subdomain list and validates candidates through DNS. It is intentionally bounded.

DNS has no universal query for every subdomain. Results are publicly discoverable and DNS-resolvable findings, not a complete inventory.

The local Express server remains available for development with `npm start`; Netlify deploys the function implementation instead.
