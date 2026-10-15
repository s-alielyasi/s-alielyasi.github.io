import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { setTimeout } from "node:timers/promises";

const source = await readFile(new URL("../index.html", import.meta.url), "utf8");
const domain = (await readFile(new URL("../CNAME", import.meta.url), "utf8")).trim();
const canonical = `https://${domain}/`;
const origin = process.env.SITE_URL || canonical;
assert.equal(new URL(origin).protocol, "https:", "Live verification requires HTTPS");
const expectedTitle = source.match(/<title\b[^>]*>([^<]+)<\/title>/)[1];
const expectedDescription = source.match(/name="description"\s+content="([^"]+)"/)[1];
const expectedData = JSON.parse(source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const deadline = Date.now() + 120_000;
const maxAttempts = Number(process.env.SITE_VERIFY_ATTEMPTS || 12);
assert(Number.isInteger(maxAttempts) && maxAttempts >= 1 && maxAttempts <= 12, "SITE_VERIFY_ATTEMPTS must be an integer from 1 to 12");
const hash = data => createHash("sha256").update(data).digest("hex");

async function get(path) {
  const remaining = deadline - Date.now();
  assert(remaining > 0, "Timed out waiting for the deployed version");
  const response = await fetch(new URL(path, origin), {
    signal: AbortSignal.timeout(Math.min(20_000, remaining)),
    headers: { "Cache-Control": "no-cache" }, cache: "no-store"
  });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    const html = (await get("./")).toString("utf8");
    assert.equal(html.match(/<title\b[^>]*>([^<]+)<\/title>/)?.[1], expectedTitle, "Live title does not match this commit");
    assert.equal(html.match(/name="description"\s+content="([^"]+)"/)?.[1], expectedDescription, "Live description does not match this commit");
    assert(html.includes(`rel="canonical" href="${canonical}"`), "Live canonical does not match CNAME");
    const liveData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    assert(liveData, "Live structured data is missing");
    assert.deepEqual(JSON.parse(liveData), expectedData, "Live structured data does not match this commit");
    assert(html.includes('class="intro-grid"'), "Live homepage content is outdated");
    assert.equal(hash(Buffer.from(html)), hash(Buffer.from(source)), "Live HTML does not match this commit");
    assert((await get("robots.txt")).toString().includes(`Sitemap: ${canonical}sitemap.xml`));
    assert((await get("sitemap.xml")).toString().includes(`<loc>${canonical}</loc>`));
    for (const file of ["assets/css/style.css", "assets/js/script.js", "assets/images/favicon.png", "assets/fonts/vazir/font-face.css", "assets/fonts/vazir/Vazir-Regular-FD.woff2", "resumes/AliElyasi_Resume_English.pdf"]) {
      const local = await readFile(new URL(`../${file}`, import.meta.url));
      assert.equal(hash(await get(file)), hash(local), `Live ${file} does not match this commit`);
    }
    console.log(`Verified current HTML, metadata, robots, sitemap, CSS, JavaScript, font and resume over HTTPS: ${origin}`);
    break;
  } catch (error) {
    if (attempt === maxAttempts || Date.now() >= deadline) throw error;
    console.log(`Waiting for the deployed version (${attempt}/${maxAttempts}): ${error.message}`);
    await setTimeout(Math.min(10_000, Math.max(0, deadline - Date.now())));
  }
}
