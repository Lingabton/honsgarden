#!/usr/bin/env python3
"""
Migrates old-style Hönsguiden pages to Field Journal design.
Extracts content from old pages and wraps in new template.
"""
import re
import os

HEAD_TEMPLATE = '''<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <title>{title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Caveat:wght@400;600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{css_path}">
</head>
<body>
  <div class="wrap">

    <header class="masthead">
      <div>
        <div class="brand"><a href="{root}" style="color:inherit;text-decoration:none">Hönsguiden</a></div>
        <div class="tagline">anteckningsbok från en trädgård i Örebro</div>
      </div>
      <nav>
        <a href="{root}luckoppnare.html">Lucköppnare</a>
        <a href="{root}honshus.html">Hönshus</a>
        <a href="{root}foderautomater.html">Foder</a>
        <a href="{root}vattenautomater.html">Vatten</a>
        <a href="{root}varmeplattor.html">Värme</a>
        <a href="{root}om-mig.html" class="muted">Om mig</a>
      </nav>
    </header>
'''

FOOTER_TEMPLATE = '''
    <footer class="site">
      <span>Gabriel Linton · Örebro · forskar om småskaligt lantbruk</span>
      <span class="write">skriv till mig: hej@honsguiden.se</span>
    </footer>
  </div>
</body>
</html>'''


def extract_title(html):
    m = re.search(r'<title>(.*?)</title>', html, re.DOTALL)
    return m.group(1).strip() if m else "Hönsguiden"

def extract_description(html):
    m = re.search(r'<meta name="description" content="(.*?)"', html, re.DOTALL)
    return m.group(1).strip() if m else ""

def extract_body_content(html):
    """Extract the main article/section content, stripping old nav/footer"""
    # Remove everything before main content
    # Try to find the article or main-content section
    content = html

    # Remove old head
    content = re.sub(r'<!DOCTYPE.*?<body[^>]*>', '', content, flags=re.DOTALL|re.IGNORECASE)

    # Remove old skip link
    content = re.sub(r'<a[^>]*class="skip-link"[^>]*>.*?</a>', '', content, flags=re.DOTALL)

    # Remove old nav
    content = re.sub(r'<nav class="nav".*?</nav>', '', content, flags=re.DOTALL)

    # Remove old mobile overlay
    content = re.sub(r'<div class="nav-overlay".*?</div>\s*\n', '', content, flags=re.DOTALL)

    # Remove old footer
    content = re.sub(r'<footer class="footer">.*?</footer>', '', content, flags=re.DOTALL)

    # Remove old scripts
    content = re.sub(r'<script src="[^"]*main\.js"[^>]*></script>', '', content)
    content = re.sub(r'<script src="[^"]*comparison\.js"[^>]*></script>', '', content)

    # Remove closing body/html
    content = re.sub(r'</body>\s*</html>\s*$', '', content, flags=re.DOTALL)

    # Clean up old wrapper classes - replace with simple content
    content = content.replace('class="container"', '')
    content = content.replace('class="section page-header"', '')
    content = content.replace('class="section"', '')
    content = content.replace('class="section quickpick"', '')
    content = content.replace('class="section quick-verdict"', '')
    content = content.replace('class="section calc-section"', '')

    # Remove old animate-in classes
    content = content.replace(' class="animate-in"', '')
    content = content.replace(' class="animate-in stagger-1"', '')
    content = content.replace(' class="animate-in stagger-2"', '')
    content = content.replace(' class="animate-in stagger-3"', '')
    content = content.replace(' class="animate-in stagger-4"', '')
    content = content.replace(' animate-in', '')
    content = content.replace(' stagger-1', '')
    content = content.replace(' stagger-2', '')
    content = content.replace(' stagger-3', '')
    content = content.replace(' stagger-4', '')

    # Remove JSON-LD scripts (keep them but they reference old styles)
    # Actually keep schema markup - it's still valid

    content = content.strip()
    return content

def migrate_page(filepath, css_path, root):
    with open(filepath, 'r') as f:
        html = f.read()

    title = extract_title(html)
    description = extract_description(html)
    content = extract_body_content(html)

    new_html = HEAD_TEMPLATE.format(
        title=title,
        description=description,
        css_path=css_path,
        root=root,
    )
    new_html += '\n    <main>\n'
    new_html += content
    new_html += '\n    </main>\n'
    new_html += FOOTER_TEMPLATE

    with open(filepath, 'w') as f:
        f.write(new_html)

    print(f"  Migrated: {filepath}")

# Root-level pages
for page in ['foderautomater.html', 'vattenautomater.html', 'varmeplattor.html',
             'om.html', 'guider.html', '404.html']:
    filepath = f'docs/{page}'
    if os.path.exists(filepath):
        migrate_page(filepath, 'css/style.css', '')

# Tools
if os.path.exists('docs/tools/kostnad.html'):
    migrate_page('docs/tools/kostnad.html', '../css/style.css', '../')

# Guide pages
for page in os.listdir('docs/guide'):
    if page.endswith('.html'):
        migrate_page(f'docs/guide/{page}', '../css/style.css', '../')

print("\nAll pages migrated!")
