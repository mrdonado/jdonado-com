# Optional request-aware proxy for Amplify static hosting

Amplify-managed CloudFront cannot be configured through `customHttp.yml` to negotiate
representations or replace a 404 body. `agent-negotiation.mjs` is a **Cloudflare Worker
module** that can sit in front of an unchanged Amplify static deployment; it is not
installed by `pnpm build` and has no effect until explicitly deployed and routed.

Before enabling it, the site owner must create the Worker, configure the nonsecret
`AMPLIFY_ORIGIN` variable to the app's HTTPS `*.amplifyapp.com` hostname, and route the
public domain(s) through it. Test on a staging hostname before changing the production
DNS. The proxy only fetches a fixed Amplify hostname, forwards normal requests and
preserves origin security headers. A preferred Markdown request to `/` fetches the
built `/index.md`; a Markdown request that receives a 404 gets a Markdown 404 with
links to `llms.txt` and the sitemap. HTML responses and existing 404 pages stay HTML.
Do not turn on HTML caching at the proxy without separating representations by `Accept`.
Run `node --test tests/*.test.mjs` to check the response selection, status, and headers
locally. Astro's own preview server is not this proxy and does not negotiate `/`.

Routing through a second CDN changes TLS, DNS, cache, and WAF responsibilities. Keep
HTTPS-only connections to Amplify and review the proxy's bot and attack protections
before enabling it; do not add User-Agent-only allow rules. If you prefer to remain
fully within AWS, use an Amplify-compatible SSR adapter for Astro and implement these
responses server-side instead, or put a separately managed CloudFront distribution
with suitable compute in front of Amplify. The existing CloudFront Functions in
`../cloudfront/` handle only the homepage, **not** Markdown 404 bodies.

After routing a staging domain, run the exact `curl -sS -L -i` checks in the audit for
both Accept values on `/` and on an unknown path. Check final status, body, Content-Type,
Vary: Accept, and the existing HSTS/CSP headers. Also verify `/llms.txt`, `/robots.txt`,
`/sitemap-index.xml`, and `/rss.xml`. The apex domain's current HTTPS → HTTP → HTTPS
redirect chain must be fixed at the domain provider separately.
