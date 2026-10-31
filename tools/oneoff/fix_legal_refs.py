# One-off (31 Oct 2026): corrects outdated legal references flagged by the audit.
# Every replacement is listed in docs/LEGAL_REVIEW_LOG.md for the reviewer.
import re, pathlib
DL = 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12848&amp;Mode=0'
RA_BANK = 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=13665&amp;Mode=0'
RA_NBFC = 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=13672&amp;Mode=0'
OTS = 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12513&amp;Mode=0'
IOS = 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=62052'
IOS_FAQ = 'https://www.rbi.org.in/commonman/Upload/English/FAQs/PDFs/RBIOS01072026.pdf'
li = lambda text, url: f'<li>{text}: <a href="{url}" target="_blank" rel="noopener">rbi.org.in</a></li>'
R = {
 'blog/digital-lending-apps-rbi-regulations.html': [
  ('Under the RBI Guidelines on Digital Lending (2022), loans must flow through regulated entities',
   'Under the Reserve Bank of India (Digital Lending) Directions, 2025, loans must flow through regulated entities'),
  ('In response, the Reserve Bank of India issued the <strong>Guidelines on Digital Lending</strong> in 2022 to put clear limits on how these apps may operate.',
   'In response, the Reserve Bank of India issued Guidelines on Digital Lending in 2022 and, on 8 May 2025, consolidated them into the <strong>Reserve Bank of India (Digital Lending) Directions, 2025</strong>, which put clear limits on how these apps may operate.'),
  ('<li>Reserve Bank of India — Guidelines on Digital Lending (2022) &amp; Fair Practices Code: <a href="https://www.rbi.org.in" target="_blank" rel="noopener nofollow">rbi.org.in</a></li>',
   li('Reserve Bank of India (Digital Lending) Directions, 2025 — RBI/2025-26/36, 8 May 2025', DL) + '\n                ' + li('Reserve Bank – Integrated Ombudsman Scheme, 2026 (in force from 1 July 2026)', IOS)),
 ],
 'blog/future-debt-resolution-fintech-india.html': [
  ('The <strong>RBI Guidelines on Digital Lending</strong>, issued in 2022, apply to regulated lenders',
   'The <strong>Reserve Bank of India (Digital Lending) Directions, 2025</strong>, which consolidated the 2022 Guidelines on Digital Lending, apply to regulated lenders'),
  ('The Reserve Bank of India issued Guidelines on Digital Lending in 2022 that apply to regulated lenders',
   'The Reserve Bank of India (Digital Lending) Directions, 2025 apply to regulated lenders'),
  ('<li>Reserve Bank of India — Guidelines on Digital Lending (2022) and borrower-protection direction: <a href="https://www.rbi.org.in" target="_blank" rel="noopener nofollow">rbi.org.in</a></li>',
   li('Reserve Bank of India (Digital Lending) Directions, 2025 — RBI/2025-26/36, 8 May 2025', DL)),
 ],
 'blog/how-to-file-rbi-complaint-recovery-harassment.html': [
  ('File a First Information Report (FIR) under applicable IPC sections.',
   'Ask the police to register a First Information Report (FIR) under the applicable provisions of the Bharatiya Nyaya Sanhita, 2023 (which replaced the IPC on 1 July 2024).'),
  ('I expect resolution within 30 days as mandated under the RBI Integrated Ombudsman Scheme framework.',
   'Please resolve this complaint within 30 days.'),
 ],
 'blog/how-to-stop-loan-harassment-india.html': [
  ('<h1>How to Stop Loan Harassment in India (2024 Legal Guide)</h1>', '<h1>How to Stop Loan Harassment in India: A Practical Guide</h1>'),
  ("the RBI's Guidelines on Digital Lending (2022) add further protections", "the Reserve Bank of India (Digital Lending) Directions, 2025 add further protections"),
  ('<li><a href="/blog/rbi-guidelines-2024-borrower-rights.html" class="text-teal fw-600">RBI Guidelines &amp; Your Borrower Rights',
   '<li><a href="/blog/rbi-guidelines-2024-borrower-rights.html" class="text-teal fw-600">RBI Rules on Recovery Agents &amp; Your Rights'),
  ('<li>Reserve Bank of India — Guidelines on Digital Lending (2022): <a href="https://www.rbi.org.in" target="_blank" rel="noopener nofollow">rbi.org.in</a></li>',
   li('Reserve Bank of India (Digital Lending) Directions, 2025 — RBI/2025-26/36, 8 May 2025', DL)),
 ],
 'blog/rbi-guidelines-2024-borrower-rights.html': [
  ('These are the current, applicable norms rather than a brand-new set of rules invented for any single year. When people refer to the "2024 RBI guidelines," they usually mean the fair-practice and recovery standards that continue to apply today. The principles below reflect that framework; we have deliberately avoided quoting any specific circular number or date, because the safest course is to read the lender\'s own fair-practice policy and the current text on the RBI website.',
   'These are the norms that apply today. RBI has also issued comprehensive amendment directions on recovery of loan dues and recovery agents — for banks, <a href="' + RA_BANK + '" target="_blank" rel="noopener">RBI/2026-27/223</a>, and for NBFCs, <a href="' + RA_NBFC + '" target="_blank" rel="noopener">RBI/2026-27/230</a>, both dated 6 August 2026 — which take effect on <strong>1 January 2027</strong>. We summarise what changes in the section below. Always check the lender\'s own fair-practice and recovery policy as well.'),
  ('including the <strong>Guidelines on Digital Lending (2022)</strong> alongside the Fair Practices Code.',
   'including the <strong>Reserve Bank of India (Digital Lending) Directions, 2025</strong> alongside the Fair Practices Code.'),
  ('<li>Reserve Bank of India — Fair Practices Code, recovery-agent norms &amp; Guidelines on Digital Lending (2022): <a href="https://www.rbi.org.in" target="_blank" rel="noopener nofollow">rbi.org.in</a></li>',
   li('RBI (Commercial Banks – Responsible Business Conduct) Fourth Amendment Directions, 2026 — RBI/2026-27/223, 6 August 2026, effective 1 January 2027', RA_BANK) + '\n                ' +
   li('RBI (NBFC – Responsible Business Conduct) Third Amendment Directions, 2026 — RBI/2026-27/230, 6 August 2026, effective 1 January 2027', RA_NBFC) + '\n                ' +
   li('Reserve Bank of India (Digital Lending) Directions, 2025 — RBI/2025-26/36, 8 May 2025', DL)),
 ],
 'editorial-policy.html': [
  ('Negotiable Instruments Act, 1881; Indian Penal Code; and other applicable laws.',
   'Negotiable Instruments Act, 1881; Bharatiya Nyaya Sanhita, 2023 (which replaced the Indian Penal Code from 1 July 2024); Arbitration and Conciliation Act, 1996; and other applicable laws.'),
 ],
}
log = []
for f, pairs in R.items():
    p = pathlib.Path('src/pages') / f; s = p.read_text()
    for old, new in pairs:
        if old not in s: raise SystemExit(f'NOT FOUND in {f}: {old[:80]}')
        s = s.replace(old, new); log.append((f, old, new))
    p.write_text(s)
# Scheme name: generic "Integrated Ombudsman Scheme" -> RB-IOS 2026, across all pages.
for p in list(pathlib.Path('src/pages').rglob('*.html')):
    s = p.read_text(); before = s
    s = re.sub(r"(?:the )?(?:Reserve Bank of India's |Reserve Bank's |RBI's |RBI )?Integrated Ombudsman Scheme(?!, 2026)( framework)?",
               "the Reserve Bank – Integrated Ombudsman Scheme, 2026", s)
    s = re.sub(r"the RBI Integrated Ombudsman(?! Scheme)", "the RBI Ombudsman", s)
    s = s.replace('the the Reserve Bank', 'the Reserve Bank')
    if s != before:
        p.write_text(s); log.append((str(p), 'Integrated Ombudsman Scheme (generic)', 'Reserve Bank – Integrated Ombudsman Scheme, 2026'))
pathlib.Path('docs/research/legal_fix_log.txt').write_text('\n\n'.join(f'{f}\n  OLD: {o}\n  NEW: {n}' for f, o, n in log))
print(len(log), 'changes')
