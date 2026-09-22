"""Check deployment paths using only the Python standard library; not an app runtime."""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.local_links = []
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('src', 'href'):
            value = attrs.get(key, '')
            if value and not value.startswith(('#', 'https://', 'http://', 'data:')):
                self.local_links.append(value.split('?')[0].split('#')[0])
                assert not value.startswith('/'), f'Root-relative path breaks project Pages: {value}'
        if tag == 'script' and 'src' in attrs:
            assert 'defer' in attrs, f'Script must defer until DOM exists: {attrs["src"]}'
            self.scripts.append(attrs['src'])

page = Page()
page.feed((ROOT / 'index.html').read_text())
assert len(page.ids) == len(set(page.ids)), 'Duplicate HTML IDs'
for path in page.local_links:
    assert (ROOT / path).is_file(), f'Missing asset: {path}'
assert page.scripts == ['data/assignments.js', 'js/data.js', 'js/ranking.js', 'js/simulation.js', 'js/ui.js', 'js/game.js', 'js/app.js'], 'Script dependency order changed'
for file in ['js/ui.js', 'js/game.js']:
    for element_id in re.findall(r"\$\('([^']+)'\)", (ROOT / file).read_text()):
        assert element_id in page.ids, f'Missing UI target: {element_id}'
for file in (ROOT / 'css').glob('*.css'):
    css = file.read_text()
    assert css.count('{') == css.count('}'), f'Unbalanced CSS: {file.name}'
assert (ROOT / '.nojekyll').exists(), 'Missing static hosting marker'
print('PASS: static assets, relative project paths, script order, DOM targets, and CSS structure.')
