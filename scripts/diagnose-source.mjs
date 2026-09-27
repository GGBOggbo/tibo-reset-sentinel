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

const publicApi = "https://tibo.cc/api/v1/resets?limit=100";
const alternative = await fetch(publicApi, { signal: AbortSignal.timeout(20_000) });
const data = await alternative.json();
console.log(JSON.stringify({ url: publicApi, status: alternative.status, stale: data.stale,
  fetchedAt: data.fetched_at, freshUntil: data.fresh_until, upstreamStatus: data.upstream_status,
  count: data.data?.length, latest: data.data?.[0],
}, null, 2));
if (!alternative.ok || data.stale !== false || data.upstream_status !== "ok"
  || !(Date.parse(data.fresh_until) > Date.now())
  || !data.data?.some(event => event.id === "2103911959544610829")) process.exitCode = 1;
