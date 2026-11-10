"""Ricostruisce ../index.html (il generatore di post e storie) dal template.
Uso: python build.py   (dalla cartella generatore-sorgenti)"""
from pathlib import Path
qui = Path(__file__).parent
t = (qui / 'merged.template.html').read_text(encoding='utf-8')
t = t.replace('%%BLACK%%', (qui / 'fonts/black.b64').read_text().strip())
t = t.replace('%%BOLD%%', (qui / 'fonts/bold.b64').read_text().strip())
assert '%%' not in t
(qui.parent / 'index.html').write_text(t, encoding='utf-8')
print('Scritto', qui.parent / 'index.html')
