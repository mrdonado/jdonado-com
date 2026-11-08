# Agent-facing homepage negotiation (deployment required)

Amplify's static `customHttp.yml` and redirect rules cannot select a response body based
on `Accept`. The site's build provides `/index.md`, but **deploying the site alone does
not enable negotiation**. Do not set `Vary: Accept` on the homepage until a request-aware
edge layer is active.

To enable the homepage check, a person with AWS and DNS access must put a separately
managed CloudFront distribution in front of the existing Amplify origin. Configure its
origin to use the app's `*.amplifyapp.com` hostname (HTTPS only; use the origin hostname
for the origin `Host` header). Copy the existing cache, security, error and HTTPS policies;
do not disable WAF or bypass access controls. Associate `homepage-request.js` at
viewer-request and `homepage-response.js` at viewer-response on the default behavior.
Keep the origin response's existing security headers. The request function maps only
`GET`/`HEAD /` with a preferred `text/markdown` Accept value to `/index.md` **before
the cache lookup**; all other requests remain unchanged. The response function adds
`Vary: Accept` on either homepage variant and labels a successful Markdown response
`text/markdown; charset=utf-8`. If your CloudFront cache policy includes the `Accept`
header as a key, retain that policy; never cache Markdown under the HTML homepage key.

Before switching DNS, test both variants against the new distribution with the intended
Host name. Confirm `/index.md` returns the generated Markdown body, that HTML still
includes the site's CSP/HSTS and that the edge does not change assets, other pages, or
error responses. Set the canonical domain to `www.jdonado.com` consistently. The apex
currently redirects `https://jdonado.com` to **`http://www.jdonado.com`** before the
CloudFront HTTPS redirect; replace that forwarding rule at the DNS/registrar provider
with a **single HTTPS 301** to `https://www.jdonado.com/` (preserving paths and queries).
Both variants must work after following that apex redirect.

For the bot finding: `public/robots.txt` already allows all bots, and a User-Agent test
does not prove a request is from a verified crawler. Review AWS WAF Bot Control logs
for `PerplexityBot` and `Applebot-Extended`, especially the exact rule and labels that
issued the challenge. Narrow _that rule_ if verified crawlers are challenged; do not
add a blanket User-Agent allow rule (anyone can forge a User-Agent). Keep normal
malicious-traffic protections and rate limits. If a new CloudFront distribution is
introduced, ensure its WAF policy is reviewed too.

After deploying, verify **final** headers and nonempty bodies:

```sh
curl -sS -L -i -H 'Accept: text/markdown' https://jdonado.com/
curl -sS -L -i -H 'Accept: text/html' https://jdonado.com/
curl -sS -L -i -A 'PerplexityBot' https://www.jdonado.com/
curl -sS -L -i -A 'Applebot-Extended' https://www.jdonado.com/
curl -sS -L -i https://www.jdonado.com/llms.txt
curl -sS -L -i https://www.jdonado.com/robots.txt
curl -sS -L -i https://www.jdonado.com/sitemap-index.xml
```

Brand search placement and external backlinks cannot be guaranteed by repository
changes. Use the canonical `https://www.jdonado.com/` on public profiles and directory
listings, confirm indexing in Search Console, and earn relevant links; this needs the
owner's accounts and editorial decisions.
