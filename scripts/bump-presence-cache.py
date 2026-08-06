from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / "index.html"
t = p.read_text(encoding="utf-8")
t2 = re.sub(
    r'src="presence\.js(?:\?v=[^"]*)?"',
    'src="presence.js?v=nocount1"',
    t,
)
p.write_text(t2, encoding="utf-8", newline="\n")
print("nocount1", "presence.js?v=nocount1" in t2)
print("hangul_ok", "접속 중" in t2)
