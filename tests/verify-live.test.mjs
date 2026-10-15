import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import https from "node:https";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execute = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
let temporary, certificate, server, origin;
let staleTitle = false;
let staleAsset = false;
let staleBody = false;

before(async () => {
  temporary = await mkdtemp(path.join(tmpdir(), "ali-site-https-"));
  certificate = path.join(temporary, "certificate.pem");
  const key = path.join(temporary, "key.pem");
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-sha256", "-nodes",
    "-keyout", key, "-out", certificate, "-days", "1", "-subj", "/CN=localhost",
    "-addext", "subjectAltName=IP:127.0.0.1,DNS:localhost"], { stdio: "ignore" });
  server = https.createServer({ key: await readFile(key), cert: await readFile(certificate) }, async (request, response) => {
    try {
      const pathname = new URL(request.url, "https://localhost").pathname;
      const file = pathname === "/" ? "index.html" : pathname.slice(1);
      let body = await readFile(path.join(root, "dist", file));
      if (staleTitle && file === "index.html") body = Buffer.from(body.toString().replace(/<title\b[^>]*>[^<]+<\/title>/, "<title>Outdated title</title>"));
      if (staleAsset && file === "assets/css/style.css") body = Buffer.from("/* cached old CSS */");
      if (staleBody && file === "index.html") body = Buffer.from(body.toString().replace("<main", "<!-- stale biography -->\n<main"));
      response.writeHead(200).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  origin = `https://127.0.0.1:${server.address().port}/`;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (temporary) await rm(temporary, { recursive: true, force: true });
});

async function verify(url = origin) {
  return execute(process.execPath, ["scripts/verify-live.mjs"], {
    cwd: root,
    env: { ...process.env, SITE_URL: url, SITE_VERIFY_ATTEMPTS: "1", NODE_EXTRA_CA_CERTS: certificate },
    timeout: 15_000
  });
}

test("accepts a complete matching release over trusted local HTTPS", async () => {
  const result = await verify();
  assert.match(result.stdout, /Verified current HTML/);
});

test("rejects an outdated title even when Open Graph still contains the expected title", async () => {
  staleTitle = true;
  try {
    await assert.rejects(verify(), error => error.code === 1 && error.stderr.includes("Live title does not match"));
  } finally { staleTitle = false; }
});

test("rejects stale body HTML even when metadata and assets match", async () => {
  staleBody = true;
  try {
    await assert.rejects(verify(), error => error.code === 1 && error.stderr.includes("Live HTML does not match"));
  } finally { staleBody = false; }
});

test("rejects stale asset bytes even when metadata matches", async () => {
  staleAsset = true;
  try {
    await assert.rejects(verify(), error => error.code === 1 && error.stderr.includes("Live assets/css/style.css does not match"));
  } finally { staleAsset = false; }
});

test("refuses plain HTTP for live verification", async () => {
  await assert.rejects(verify(origin.replace("https:", "http:")), error => error.code === 1 && error.stderr.includes("requires HTTPS"));
});
