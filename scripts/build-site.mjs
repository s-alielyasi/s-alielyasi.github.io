import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const publicFiles = ["index.html", "assets", "resumes", "robots.txt", "sitemap.xml", "CNAME", "LICENSE"];

await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const file of publicFiles) {
  await cp(path.join(root, file), path.join(output, file), { recursive: true });
}
await writeFile(path.join(output, ".nojekyll"), "");
console.log("Prepared dist/ with public site files and licenses.");
