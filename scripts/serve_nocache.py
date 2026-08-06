# -*- coding: utf-8 -*-
"""Local static server with no-cache headers so HTML/JS edits show immediately."""
from __future__ import annotations

import functools
import http.server
import os
import socketserver
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        # Ensure UTF-8 for HTML
        if self.path == "/" or self.path.startswith("/index.html") or self.path.endswith(".html"):
            # SimpleHTTPRequestHandler may already set Content-Type; override charset
            pass
        super().end_headers()

    def guess_type(self, path):
        ctype = super().guess_type(path)
        # Py3.12 returns str; older may return tuple — handle both
        if isinstance(ctype, tuple):
            ctype = ctype[0]
        if ctype.startswith("text/html") and "charset" not in ctype:
            return "text/html; charset=utf-8"
        if ctype.startswith("text/") and "charset" not in ctype:
            return ctype + "; charset=utf-8"
        if ctype in ("application/javascript", "text/javascript", "application/json"):
            if "charset" not in ctype:
                return ctype + "; charset=utf-8"
        return ctype


def main() -> None:
    os.chdir(ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"Serving {ROOT} on http://127.0.0.1:{PORT}/ (no-cache)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nbye")


if __name__ == "__main__":
    main()
