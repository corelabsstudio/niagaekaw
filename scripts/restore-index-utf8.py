"""Restore index.html from last good UTF-8 commit and re-apply cache busts."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
GOOD = "24108b2"

raw = subprocess.check_output(["git", "show", f"{GOOD}:index.html"], cwd=ROOT)
text = raw.decode("utf-8")

# cache-bust linked assets
text = re.sub(
    r'href="styles\.css(?:\?v=[^"]*)?"',
    'href="styles.css?v=audit1"',
    text,
)
for name in (
    "presence.js",
    "anomalies.js",
    "climax-triggers.js",
    "phase3-triggers.js",
):
    text = re.sub(
        rf'src="{re.escape(name)}(?:\?v=[^"]*)?"',
        f'src="{name}?v=audit1"',
        text,
    )

# ensure presence labels are correct Korean (in case partial damage)
text = text.replace(
    'id="presenceLiveLabel" class="presence-label">접속 중</span>',
    'id="presenceLiveLabel" class="presence-label">접속 중</span>',
)
# if already good, no-op; if broken patterns exist, force fix via regex
text = re.sub(
    r'(id="presenceLiveLabel"[^>]*>)[^<]*(</span>)',
    r"\1접속 중\2",
    text,
    count=1,
)
text = re.sub(
    r'(id="presenceTotalLabel"[^>]*>)[^<]*(</span>)',
    r"\1총 방문자\2",
    text,
    count=1,
)

out = ROOT / "index.html"
out.write_text(text, encoding="utf-8", newline="\n")

hangul = sum(1 for ch in text if "\uac00" <= ch <= "\ud7a3")
print("hangul_count", hangul)
print("has_접속_중", "접속 중" in text)
print("has_총_방문자", "총 방문자" in text)
print("has_한_층", "한 층 더" in text)
print("styles_bust", "styles.css?v=audit1" in text)
print("climax_bust", "climax-triggers.js?v=audit1" in text)
print("wrote", out)
