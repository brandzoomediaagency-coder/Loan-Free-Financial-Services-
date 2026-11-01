#!/usr/bin/env python3
"""Writes docs/inventory/*.md from the built site (run `node tools/build.mjs` first).

Usage: python3 tools/oneoff/make_inventories.py [path/to/LoanFree_Audit_Workbook.xlsx]
The workbook is optional; without it the keyword-to-URL map is skipped.
"""
import json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'inventory')
os.makedirs(OUT, exist_ok=True)

data = json.loads(subprocess.check_output(['node', 'tools/check.mjs', '--json'], cwd=ROOT))
inv = sorted(data['inventory'], key=lambda r: r['path'])
inbound = data['inbound']
md = lambda s: str(s or '').replace('|', '\\|').replace('\n', ' ')

def h1_of(path):
    f = os.path.join(ROOT, 'dist', 'index.html' if path == '/' else path.lstrip('/'))
    if path.endswith('/'):
        f = os.path.join(ROOT, 'dist', path.lstrip('/'), 'index.html')
    try:
        m = re.search(r'<h1[^>]*>(.*?)</h1>', open(f, encoding='utf-8').read(), re.S)
        return re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else ''
    except FileNotFoundError:
        return ''

with open(os.path.join(OUT, 'metadata.md'), 'w') as f:
    f.write('# Metadata inventory\n\nGenerated from the production build. Title/description lengths count the HTML-escaped text.\n\n')
    f.write('| URL | Title | T | Description | D | H1 | Robots |\n|---|---|---|---|---|---|---|\n')
    for r in inv:
        f.write(f"| {r['path']} | {md(r['title'])} | {r['titleLength']} | {md(r['description'])} | {r['descriptionLength']} | {md(h1_of(r['path']))} | {r['robots'] or 'index'} |\n")

with open(os.path.join(OUT, 'structured-data.md'), 'w') as f:
    f.write('# Structured data inventory\n\nJSON-LD @types found on each page of the production build. Validate with https://validator.schema.org/ and the Rich Results Test after deployment. FAQ markup does not guarantee FAQ rich results.\n\n')
    f.write('| URL | JSON-LD types |\n|---|---|\n')
    for r in inv:
        f.write(f"| {r['path']} | {md(r['schema'])} |\n")

with open(os.path.join(OUT, 'internal-links.md'), 'w') as f:
    f.write('# Internal links: inbound link count per page\n\nCounts links from other pages in the production build (navigation and footer included). Pages with few inbound links need contextual links.\n\n')
    f.write('| URL | Inbound links |\n|---|---|\n')
    for path, n in sorted(inbound.items(), key=lambda kv: kv[1]):
        f.write(f'| {path} | {n} |\n')

vercel = json.load(open(os.path.join(ROOT, 'vercel.json')))
with open(os.path.join(OUT, 'redirects.md'), 'w') as f:
    f.write('# Redirects (vercel.json)\n\nAll permanent (308). The apex-domain rule only takes effect once the apex is served by this project; also set loanfree.info -> www.loanfree.info as a permanent redirect in Vercel > Domains.\n\n')
    f.write('| Source | Condition | Destination |\n|---|---|---|\n')
    for r in vercel.get('redirects', []):
        cond = ', '.join(f"{h['type']}={h.get('value', '')}" for h in r.get('has', []))
        f.write(f"| {r['source']} | {cond} | {r['destination']} |\n")

if len(sys.argv) > 1:
    import openpyxl
    wb = openpyxl.load_workbook(sys.argv[1], read_only=True)
    rows = list(wb['Keyword-URL Map'].iter_rows(values_only=True))
    live = {r['path'] for r in inv}
    drafts = set()
    for dp, _, files in os.walk(os.path.join(ROOT, 'src', 'pages')):
        for fn in files:
            if fn.endswith('.html'):
                p = os.path.join(dp, fn)
                if '"status": "draft"' in open(p, encoding='utf-8').read():
                    rel = '/' + os.path.relpath(p, os.path.join(ROOT, 'src', 'pages')).replace(os.sep, '/')
                    drafts.add(rel.replace('index.html', ''))
    with open(os.path.join(OUT, 'keyword-url-map.md'), 'w') as f:
        f.write('# Keyword-to-URL map\n\nFrom the audit workbook (31 Oct 2026). "Build status" is the state of the URL in this branch. Search volumes were unavailable in the audit and are not invented here.\n\n')
        f.write('| Target URL | Primary keyword | Supporting keywords | Priority | Audit status | Build status |\n|---|---|---|---|---|---|\n')
        for r in rows[1:]:
            if not r or not r[0]:
                continue
            url = r[0].strip()
            paths = re.findall(r'(/[\w\-/.]*)', url)
            first = paths[0] if paths else ''
            if first in live:
                status = 'Live'
            elif first in drafts:
                status = 'Draft (awaiting review)'
            elif not paths:
                status = 'Off-site (GBP / citations)'
            else:
                status = 'Not yet created'
            f.write(f'| {url} | {md(r[2])} | {md(r[3])} | {md(r[5])} | {md(r[1])} | {status} |\n')

print('Wrote inventories to docs/inventory/')
