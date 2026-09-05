import fs from 'node:fs';
import path from 'node:path';

const referenceId = process.argv[2];
if (!referenceId) throw new Error('usage: node sanitize-static-import.mjs <reference-id>');

const root = process.cwd();
const refDir = path.join(root, 'labs', 'references', referenceId);
if (!fs.existsSync(path.join(refDir, 'index.html'))) throw new Error(`${referenceId}: index.html missing`);

const base = `/labs/references/${referenceId}`;
const placeholder = `${base}/media-placeholder.svg`;
const emptyScript = `${base}/empty.js`;
const rules = [
  {
    name: 'cosmos-demo-media',
    regex: /https:\/\/images\.beta\.cosmos\.so\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+/g,
    replacement: placeholder
  },
  {
    name: 'spotify-demo-media',
    regex: /https:\/\/i\.scdn\.co\/image\/[A-Za-z0-9._~%-]+/g,
    replacement: placeholder
  },
  {
    name: 'pinterest-demo-media',
    regex: /https:\/\/i\.pinimg\.com\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+/g,
    replacement: placeholder
  },
  {
    name: 'onedollarstats-analytics',
    regex: /https:\/\/assets\.onedollarstats\.com\/stonks\.js/g,
    replacement: emptyScript
  }
];

const textExtensions = new Set(['.html', '.js', '.mjs', '.json', '.css', '.txt', '.map', '.xml']);
const counts = Object.fromEntries(rules.map(rule => [rule.name, 0]));
let touched = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'evidence') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.isFile() || !textExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    let text;
    try { text = fs.readFileSync(full, 'utf8'); } catch { continue; }
    const original = text;
    for (const rule of rules) {
      text = text.replace(rule.regex, match => {
        counts[rule.name] += 1;
        return rule.replacement;
      });
    }
    if (text !== original) {
      fs.writeFileSync(full, text);
      touched += 1;
    }
  }
}

walk(refDir);

fs.writeFileSync(path.join(refDir, 'media-placeholder.svg'), `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">\n  <rect width="1600" height="1000" fill="#f4f4f5"/>\n</svg>\n`);
fs.writeFileSync(path.join(refDir, 'empty.js'), `'use strict';\n// Intentionally empty: external analytics is disabled in the Valentine reference import.\n`);

const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
if (total < 1) throw new Error(`${referenceId}: expected at least one external demo-media/analytics URL to sanitize`);
const manifest = {
  version: '1.0',
  reference_id: referenceId,
  policy: 'Replace externally hosted demo media with a neutral local SVG and external analytics with a no-op local script; outbound navigation links are not rewritten.',
  replacement_assets: {
    media: 'media-placeholder.svg',
    analytics: 'empty.js'
  },
  replacements: counts,
  total_replacements: total,
  touched_files: touched
};
fs.writeFileSync(path.join(refDir, 'SANITIZATION.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`REFERENCE_STATIC_SANITIZE_OK id=${referenceId} replacements=${total} files=${touched}`);
for (const [name, count] of Object.entries(counts)) console.log(` sanitized ${name}=${count}`);
