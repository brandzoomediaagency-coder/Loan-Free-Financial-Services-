# One-off (31 Oct 2026): structural fixes to all migrated guides in src/pages/blog.
import json, re, pathlib
GENERIC = ('blog-legal.jpg', 'blog-finance.jpg', 'blog-cards.jpg')
for p in sorted(pathlib.Path('src/pages/blog').glob('*.html')):
    raw = p.read_text(); slug = p.stem
    m = re.match(r'^<!--page\s*([\s\S]*?)\s*-->\s*', raw)
    fm = json.loads(m.group(1)); body = raw[m.end():]
    # 1. Bylines -> shared review box (dates come from front matter).
    body, n1 = re.subn(r'<p class="text-muted"[^>]*>\s*<i class="far fa-calendar-alt"></i>[\s\S]*?</p>', '<!-- lf:review-box -->', body, count=1)
    body, n2 = re.subn(r'<p class="lead-text"[^>]*>Published:[^<]*</p>', '<!-- lf:review-box -->', body, count=1)
    # 2. Unverifiable "reviewed by our advisors" box at the end.
    body = re.sub(r'\s*<div class="reviewer-box">[\s\S]*?</div>', '', body)
    # 3. Generic or irrelevant stock photos -> the guide's own topic image.
    def swap(mm):
        tag = mm.group(0)
        if not any(g in tag for g in GENERIC): return tag
        alt = re.search(r'alt="([^"]*)"', tag).group(1)
        return (f'<img src="/assets/thumbs/{slug}-1200.webp" srcset="/assets/thumbs/{slug}.webp 600w, /assets/thumbs/{slug}-1200.webp 1200w" '
                f'sizes="(max-width: 860px) 100vw, 780px" width="1200" height="800" alt="{alt}">')
    body = re.sub(r'<img\b[^>]*>', swap, body)
    if fm.get('image', '').split('/')[-1] in GENERIC:
        fm['image'] = f'/assets/thumbs/{slug}-1200.webp'
    # 4. First image in the article is the LCP candidate.
    body = re.sub(r'<img\b(?![^>]*fetchpriority)', '<img fetchpriority="high"', body, count=1)
    body = re.sub(r'(<img fetchpriority="high"[^>]*?)\sloading="[^"]*"', r'\1', body, count=1)
    # 5. Every guide links back to its service page.
    svc = fm.get('serviceLink')
    if svc and f'href="{svc}"' not in body:
        body = re.sub(r'(<ul class="no-list"[^>]*>)', lambda mm: mm.group(1) + f'\n                <li><a href="{svc}" class="text-teal fw-600">Our related service <i class="fas fa-arrow-right"></i></a></li>', body, count=1)
    fm['dateModified'] = fm.get('dateModified', '2026-06-02')
    p.write_text('<!--page\n' + json.dumps(fm, indent=2, ensure_ascii=False) + '\n-->\n' + body)
    print(f'{slug:50} byline={n1+n2} svc_link={"yes" if svc and svc in body else "NO"}')
