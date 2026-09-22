"""Intègre les fragments statiques des démos, sans étape de build supplémentaire."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def demo_markup(service):
    demo = service.get("demo")
    if not demo:
        return ""
    fragment = (ROOT / "assets" / "demos" / (demo.get("fragment", demo["id"]) + ".html")).read_text(encoding="utf-8")
    scene = f' data-scene="{demo["fragment"]}"' if demo.get("fragment") else ""
    eyebrow = demo.get("eyebrow", "À vous d’essayer")
    return f'''<section class="service-demo-section" id="demo" aria-labelledby="demo-title">
  <div class="container">
    <div class="demo-intro"><div><span class="eyebrow">{eyebrow}</span><h2 id="demo-title">{demo['title']}</h2></div><p>{demo['hint']}</p></div>
    <div class="service-demo" data-demo="{demo['id']}"{scene}>{fragment}</div>
    <p class="demo-caption">{demo['caption']}</p>
  </div>
</section>'''
