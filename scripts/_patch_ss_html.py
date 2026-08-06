# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "index.html"
text = p.read_text(encoding="utf-8")

import re

text2, n = re.subn(
    r'(<p class="ss-status" id="ssStatus">)[^<]*(</p>)',
    r"\1screen saver · idle\2",
    text,
    count=1,
)
print("status replace", n)
text = text2

old_g = """    <div class=\"ss-ghost ss-ghost-weak\" id=\"ssGhostWeak\" hidden>
      <img src=\"assets/faces/face-1.jpg\" alt=\"\" draggable=\"false\" />
    </div>
    <div class=\"ss-ghost ss-ghost-med\" id=\"ssGhostMed\" hidden>
      <img src=\"assets/faces/face-4.jpg\" alt=\"\" draggable=\"false\" />
    </div>
    <div class=\"ss-ghost ss-ghost-strong\" id=\"ssGhostStrong\" hidden>
      <img src=\"assets/faces/face-7.jpg\" alt=\"\" draggable=\"false\" />
    </div>"""

new_g = """    <div class=\"ss-ghost ss-ghost-weak\" id=\"ssGhostWeak\" hidden aria-hidden=\"true\">
      <img src=\"assets/horror/ghost_weak_phase2.png\" alt=\"\" draggable=\"false\" decoding=\"async\" />
    </div>
    <div class=\"ss-ghost ss-ghost-med\" id=\"ssGhostMed\" hidden aria-hidden=\"true\">
      <img src=\"assets/horror/ghost_medium_phase3.png\" alt=\"\" draggable=\"false\" decoding=\"async\" />
    </div>
    <div class=\"ss-ghost ss-ghost-strong\" id=\"ssGhostStrong\" hidden aria-hidden=\"true\">
      <img src=\"assets/horror/ghost_strong_climax.png\" alt=\"\" draggable=\"false\" decoding=\"async\" />
    </div>
    <div class=\"ss-ghost ss-ghost-strong ss-ghost-trail\" id=\"ssGhostStrongTrail\" hidden aria-hidden=\"true\">
      <img src=\"assets/horror/ghost_strong_climax.png\" alt=\"\" draggable=\"false\" decoding=\"async\" />
    </div>
    <button type=\"button\" class=\"ss-esc-btn\" id=\"ssEscBtn\" hidden aria-hidden=\"true\" title=\"esc\">esc</button>"""

if old_g in text:
    text = text.replace(old_g, new_g, 1)
    print("ghost block ok")
else:
    print("ghost block NOT FOUND")
    i = text.find("ssGhostWeak")
    print(repr(text[i - 40 : i + 500]) if i >= 0 else "no ssGhostWeak")

text = text.replace("climax-sequence.js?v=ss60", "climax-sequence.js?v=ss60v2", 1)
text = text.replace("styles.css?v=realphoto1", "styles.css?v=ss60v2", 1)

p.write_text(text, encoding="utf-8")
print("written")
