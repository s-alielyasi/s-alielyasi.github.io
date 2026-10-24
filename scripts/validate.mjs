import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const html = await readFile(path.join(root, "index.html"), "utf8");
const domain = (await readFile(path.join(root, "CNAME"), "utf8")).trim();
const canonical = `https://${domain}/`;
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
assert.equal([...html.matchAll(/<h1\b/g)].length, 1, "Use one main heading");

for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const reference = match[1];
  if (reference.startsWith("#")) assert(ids.includes(reference.slice(1)), `Missing anchor ${reference}`);
  else if (!/^[a-z][a-z\d+.-]*:/i.test(reference)) {
    await access(path.join(root, decodeURIComponent(reference.split(/[?#]/)[0])));
  }
}
for (const css of ["assets/css/style.css", "assets/fonts/vazir/font-face.css"]) {
  const contents = await readFile(path.join(root, css), "utf8");
  for (const match of contents.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    await access(path.resolve(root, path.dirname(css), match[1]));
  }
}
const getMeta = (attribute, name) => {
  const tag = [...html.matchAll(/<meta\b[^>]+>/g)].map(match => match[0])
    .find(tag => tag.includes(`${attribute}="${name}"`));
  assert(tag, `Missing metadata: ${name}`);
  return tag.match(/\bcontent="([^"]*)"/)[1];
};
assert(html.includes(`<link rel="canonical" href="${canonical}"`), "Canonical must match CNAME");
assert.equal(getMeta("property", "og:url"), canonical);
assert.equal(getMeta("property", "og:description"), getMeta("name", "description"));
const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const graph = data["@graph"];
assert.equal(graph.find(node => node["@type"] === "ProfilePage").description, getMeta("name", "description"));
const entityIds = new Set(graph.map(node => node["@id"]));
for (const node of graph) {
  assert.equal(node.url, canonical);
  for (const value of Object.values(node)) {
    if (value && typeof value === "object" && value["@id"]) assert(entityIds.has(value["@id"]));
  }
}
const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), [canonical]);
assert((await readFile(path.join(root, "robots.txt"), "utf8")).includes(`Sitemap: ${canonical}sitemap.xml`));
assert.deepEqual(await readdir(path.join(root, "resumes")), ["AliElyasi_Resume_English.pdf"]);
const pdf = await readFile(path.join(root, "resumes/AliElyasi_Resume_English.pdf"));
assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
console.log("Validated anchors, local assets, PDF, metadata, structured data and canonical URLs.");
