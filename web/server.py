#!/usr/bin/env python3
"""
Mini serveur HTTP en Python
Usage: python server.py [port]
Par défaut: port 8080
"""

import http.server
import json
import os
import sys
import mimetypes
from urllib.parse import urlparse, parse_qs
from datetime import datetime

# Configuration
HOST = "0.0.0.0"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


class APIHandler(http.server.BaseHTTPRequestHandler):
    """Gestionnaire de requêtes HTTP personnalisé"""

    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def _send_json(self, data, status=200):
        self._set_headers(status)
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def _serve_file(self, filepath):
        """Sert un fichier statique"""
        if not os.path.exists(filepath) or not os.path.isfile(filepath):
            self._send_json({"error": "Fichier non trouvé"}, 404)
            return

        mime_type, _ = mimetypes.guess_type(filepath)
        if mime_type is None:
            mime_type = "application/octet-stream"

        try:
            with open(filepath, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", len(content))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def do_OPTIONS(self):
        """Gestion des requêtes CORS preflight"""
        self._set_headers(204)

    def do_GET(self):
        """Gestion des requêtes GET"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Page d'accueil -> index.html
        if path == "/" or path == "/index.html":
            self._serve_file(os.path.join(STATIC_DIR, "index.html"))

        # Fichiers statiques du front (js, css, etc.)
        elif path.endswith((".js", ".css", ".html", ".png", ".jpg", ".ico", ".svg")):
            filepath = os.path.join(STATIC_DIR, path.lstrip("/"))
            self._serve_file(filepath)

        elif path == "/health":
            self._send_json({"status": "ok", "timestamp": datetime.now().isoformat()})

        elif path == "/api/info":
            self._send_json({
                "server": "Mini HTTP Server",
                "python_version": sys.version,
                "endpoints": ["/", "/health", "/api/info", "/api/echo"]
            })

        else:
            self._send_json({"error": "Route non trouvée"}, 404)

    def do_POST(self):
        """Gestion des requêtes POST"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Lecture du body
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""

        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            data = {"raw": body}

        if path == "/api/echo":
            self._send_json({
                "received": data,
                "timestamp": datetime.now().isoformat()
            })
        else:
            self._send_json({"error": "Route non trouvée"}, 404)

    def log_message(self, format, *args):
        """Log personnalisé des requêtes"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {args[0]}")


def run_server():
    """Lance le serveur HTTP"""
    # Changer vers le répertoire du script
    os.chdir(os.path.dirname(os.path.abspath(__file__)) or ".")

    # Créer le serveur
    server = http.server.HTTPServer((HOST, PORT), APIHandler)

    print(f"\n{'='*50}")
    print(f"🚀 Serveur démarré sur http://{HOST}:{PORT}")
    print(f"{'='*50}")
    print(f"\nEndpoints disponibles:")
    print(f"  GET  http://localhost:{PORT}/          - index.html (front)")
    print(f"  GET  http://localhost:{PORT}/health    - Health check")
    print(f"  GET  http://localhost:{PORT}/api/info  - Informations serveur")
    print(f"  POST http://localhost:{PORT}/api/echo  - Echo JSON")
    print(f"\nFichiers statiques servis depuis: {STATIC_DIR}")
    print(f"\nAppuyez sur Ctrl+C pour arrêter le serveur\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Serveur arrêté")
        server.shutdown()


if __name__ == "__main__":
    run_server()
