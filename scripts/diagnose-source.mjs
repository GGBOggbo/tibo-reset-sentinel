// Read-only diagnostic: no credentials, no history writes, no alternate IPs.
const url = "https://codex-resets.com/api/v1/resets?limit=100";
const response = await fetch(url, {
  signal: AbortSignal.timeout(20_000),
  headers: { "user-agent": "edu-shaobing-sentinel/1.0" },
});
const body = await response.text();
const allowed = ["server", "content-type", "location", "cf-ray", "cf-mitigated", "retry-after", "x-request-id"];
console.log(JSON.stringify({ url: response.url, status: response.status,
  headers: Object.fromEntries(allowed.map(name => [name, response.headers.get(name)])),
  bodyPreview: body.slice(0, 2000),
}, null, 2));
