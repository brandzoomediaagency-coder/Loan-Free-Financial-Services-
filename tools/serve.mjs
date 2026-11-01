#!/usr/bin/env node
// Local preview server that mimics the production Vercel setup closely enough
// for testing: static files, vercel.json redirects + headers, the /api/lead
// function, a branded 404, and the /drafts/ folder (never deployed).
//
// Usage (from the project root): node tools/build.mjs && node tools/serve.mjs --root dist [--port 8080]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const ROOT = path.resolve(opt('--root', process.cwd()));
const PORT = Number(opt('--port', 8080));
// vercel.json and api/ always come from the project directory (cwd).
const PROJECT = process.cwd();

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json',
};

let vercel = {};
try { vercel = JSON.parse(fs.readFileSync(path.join(PROJECT, 'vercel.json'), 'utf8')); } catch { /* optional */ }

// Convert a Vercel path pattern ("/blog/:slug*", "/(.*)\\.css") into a RegExp.
function toRegex(source) {
  let re = '';
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === ':') {
      const m = /^:(\w+)(\*|\+)?/.exec(source.slice(i));
      re += m[2] ? '(.*)' : '([^/]+)';
      i += m[0].length - 1;
    } else re += c;
  }
  return new RegExp('^' + re + '$');
}

function applyRedirect(urlPath, host) {
  for (const r of vercel.redirects || []) {
    if (r.has && !r.has.every((h) => h.type === 'host' && new RegExp(h.value).test(host))) continue;
    const m = toRegex(r.source).exec(urlPath);
    if (!m) continue;
    let dest = r.destination;
    const names = [...r.source.matchAll(/:(\w+)/g)].map((x) => x[1]);
    names.forEach((n, i) => { dest = dest.replace(new RegExp(':' + n + '\\*?', 'g'), m[i + 1] || ''); });
    return { status: r.statusCode || (r.permanent ? 308 : 307), location: dest };
  }
  return null;
}

function headersFor(urlPath) {
  const out = {};
  for (const h of vercel.headers || []) {
    if (toRegex(h.source).test(urlPath)) for (const { key, value } of h.headers) out[key] = value;
  }
  return out;
}

async function handleApi(req, res, name) {
  const file = path.join(PROJECT, 'api', name + '.js');
  if (!fs.existsSync(file)) return false;
  const mod = await import(pathToFileURL(file).href + '?t=' + Date.now());
  const handler = mod.default || mod;
  let body = '';
  for await (const chunk of req) body += chunk;
  try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = body; }
  // Minimal Vercel-style response helpers.
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
  res.send = (s) => { res.end(s); return res; };
  await handler(req, res);
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let urlPath = decodeURIComponent(url.pathname);
  const redirect = applyRedirect(urlPath, req.headers.host || 'localhost');
  if (redirect) {
    res.writeHead(redirect.status, { Location: redirect.location + url.search });
    return res.end();
  }
  if (urlPath.startsWith('/api/')) {
    if (await handleApi(req, res, urlPath.slice(5).replace(/\/$/, ''))) return;
  }
  let file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (urlPath.endsWith('/')) file = path.join(file, 'index.html');
  let status = 200;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    status = 404;
    file = path.join(ROOT, '404.html');
    urlPath = '/404.html';
  }
  const headers = { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', ...headersFor(urlPath) };
  // Compress text responses like Vercel does, so local Lighthouse runs see realistic transfer sizes.
  if (!process.argv.includes('--no-gzip') && /\b(gzip)\b/.test(req.headers['accept-encoding'] || '') && /^(text\/|application\/(json|javascript|xml)|image\/svg)/.test(headers['Content-Type'])) {
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
    res.writeHead(status, headers);
    return fs.createReadStream(file).pipe(zlib.createGzip()).pipe(res);
  }
  res.writeHead(status, headers);
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log(`Serving ${ROOT} on http://localhost:${PORT}/`));
