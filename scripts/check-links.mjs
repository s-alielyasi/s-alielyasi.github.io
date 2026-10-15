import { readFile, writeFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const anchors = [...html.matchAll(/<a\b[^>]*href="(https?:\/\/[^"]+)"/g)].map(match => match[1]);
const urls = [...new Set(["https://ali-elyasi.ir/", ...anchors])];
const results = [];
for (const url of urls) {
  try {
    const response = await fetch(url, {
      redirect: "follow", signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": "AliElyasiSite-LinkCheck/1.0" }
    });
    await response.body?.cancel();
    results.push({ url, finalUrl: response.url, status: response.status,
      result: response.ok ? "reachable" : [401, 403, 429, 999].includes(response.status) ? "restricted" : "http-error" });
  } catch (error) {
    results.push({ url, result: "inconclusive", error: error.cause?.code || error.name });
  }
}
const report = { checkedAt: new Date().toISOString(), method: "Public HTTP GET only; no form submission, login or payment.", results };
const output = process.argv[2];
if (output) await writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
// Anti-bot restrictions and network failures are reported, not treated as proof of a dead link.
if (results.some(result => [404, 410].includes(result.status))) process.exitCode = 1;
