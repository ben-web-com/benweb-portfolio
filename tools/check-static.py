"""Contrôles des fichiers publiés, sans dépendance ni modification."""
import hashlib
import json
import re
import subprocess
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.links=[]; self.json=[]; self.current=None; self.in_script=False; self.forms=[]; self.fields=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        for key in ['src','href','action']:
            if a.get(key): self.links.append(a[key])
        if a.get('srcset'): self.links.extend(s.strip().split()[0] for s in a['srcset'].split(','))
        if tag=='script' and a.get('type')=='application/ld+json': self.current=''; self.in_script=True
        if tag=='form': self.forms.append(a)
        if tag in ['input','textarea']: self.fields.append(a)
        assert tag!='iframe', 'Aucun iframe attendu'
    def handle_data(self,data):
        if self.in_script: self.current+=data
    def handle_endtag(self,tag):
        if tag=='script' and self.in_script: self.json.append(json.loads(self.current)); self.in_script=False

pages={p.name:Page() for p in ROOT.glob('*.html')}
for name, page in pages.items():
    page.feed((ROOT/name).read_text())
    assert not [i for i,n in Counter(page.ids).items() if n>1],(name,'IDs dupliqués')
    for link in page.links:
        parsed=urlsplit(link)
        if parsed.scheme or parsed.netloc: continue
        path=unquote(parsed.path).lstrip('/') or (name if parsed.fragment else 'index.html')
        assert not path.startswith('tools/'),(name,link)
        target=ROOT/path
        assert target.exists(),(name,link)
        if parsed.fragment and target.suffix=='.html':
            other=Page();other.feed(target.read_text());assert parsed.fragment in other.ids,(name,link)
assert len(pages)==15
root=ET.parse(ROOT/'sitemap.xml').getroot()
urls=[e.text for e in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls)==len(set(urls))==13
expected={'https://ben-web.com/' if name=='index.html' else 'https://ben-web.com/'+name for name in pages if name not in ['404.html','merci.html']}
assert set(urls)==expected,(set(urls)^expected)
contact=pages['contact.html']; form=contact.forms[0]
assert form.get('action')=='https://formspree.io/f/mwlkgrjo' and form.get('method')=='POST' and form.get('name')=='devis'
assert 'data-netlify' not in form
assert {a.get('name') for a in contact.fields}=={'service','activite','situation','delai','nom','email','telephone','message','_gotcha'}
assert sum(a.get('name')=='service' for a in contact.fields)==7
for name in ['404.html','merci.html']: assert 'noindex' in (ROOT/name).read_text()
original=subprocess.check_output(['git','show','HEAD:assets/css/style.css'],cwd=ROOT,text=True)
assert (ROOT/'assets/css/style.css').read_text().startswith(original),'Tokens et CSS d’origine altérés'
for image in ['ben','logo-full']:
    for ext in ['png','webp']: assert (ROOT/'assets'/f'{image}.{ext}').exists()
for path in (ROOT/'assets').rglob('*.css'):
    for link in re.findall(r'url\([\'\"]?([^\)\'\"]+)',path.read_text()):
        parsed=urlsplit(link)
        if not parsed.scheme and not unquote(link).startswith('#'): assert (path.parent/unquote(parsed.path)).exists(),(str(path),link)
print('15 pages, 13 URL sitemap, liens locaux/ancres, JSON-LD, formulaire Formspree et identité : OK')
print('Poids des démos CSS/JS :',sum(p.stat().st_size for p in (ROOT/'assets/demos').glob('*') if p.suffix in ['.css','.js']),'octets (modules chargés par service).')
