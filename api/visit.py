"""Opt-in visitor registration for ShopDirect P3.1.

No visitor data is persisted by this app. A successful submission sends ONE
notification to the course author via Resend's HTTPS API, configured through
Vercel's encrypted environment variables. This is not account authentication.
"""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse
from datetime import datetime, timezone
from html import escape as html_escape
from email.utils import parseaddr
import json
import os
import re
import time
import threading
import urllib.request
import urllib.error

MAX_PAYLOAD = 2048
MAX_NAME = 96
MAX_EMAIL = 180
TIMEOUT_SECONDS = 12
# Best-effort local process throttling; production abuse requires Vercel WAF or
# shared datastore because serverless instances don't share memory.
_RATE_GUARD = {}
_RATE_LOCK = threading.Lock()
_RATE_WINDOW = 90
_RATE_MAX = 4

def settings():
    key = os.environ.get("RESEND_API_KEY", "").strip()
    sender = os.environ.get("VISIT_NOTIFY_FROM", "").strip()
    recipient = os.environ.get("VISIT_NOTIFY_TO", "").strip()
    return {
        "key": key,
        "sender": sender,
        "recipient": recipient,
        "enabled": bool(key and sender and recipient),
    }

def validate_name(value):
    if not isinstance(value, str):
        raise ValueError("Попълнете имената си.")
    name = " ".join(value.split())
    if not 2 <= len(name) <= MAX_NAME or any(ord(ch) < 32 for ch in name):
        raise ValueError("Моля, въведете име между 2 и 96 символа.")
    # Unicode letters, whitespace, dashes and apostrophes; no HTML/code.
    if not all(ch.isalpha() or ch.isspace() or ch in "–-’'." for ch in name):
        raise ValueError("Името съдържа недопустими символи.")
    return name

def validate_email(value):
    if not isinstance(value, str):
        raise ValueError("Въведете имейл адрес.")
    email = value.strip()
    address = parseaddr(email)[1]
    if (
        len(email) > MAX_EMAIL or not 5 <= len(email) or
        email != address or "@" not in email or
        not re.fullmatch(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,24}", email) or
        "\r" in email or "\n" in email
    ):
        raise ValueError("Моля, въведете валиден имейл адрес.")
    return email

def compose_notification(name, email, now):
    subject = "ShopDirect P3.1 · Нов регистриран посетител"
    clean_name = html_escape(name, quote=True)
    clean_email = html_escape(email, quote=True)
    stamp = now.strftime("%d.%m.%Y %H:%M UTC")
    plain = (
        "Ново регистрирано посещение на курсовата работа ShopDirect P3.1.\n\n"
        f"Имена: {name}\n"
        f"Имейл: {email}\n"
        f"Време (UTC): {stamp}\n"
        "Страница: https://shopdirect-nine.vercel.app/\n\n"
        "Посетителят изрично потвърди, че тези данни могат да бъдат"
        " изпратени на автора като известие за посещение.\n"
        "Това не е потвърдена самоличност или регистрация на акаунт."
    )
    html = f"""<!DOCTYPE html><html lang="bg"><body style="margin:0;background:#0b0714;color:#f7f5ff;font:15px/1.7 Arial,sans-serif;padding:36px">
    <div style="max-width:560px;margin:auto;background:#1c1033;border:1px solid #8b5cff;border-radius:20px;padding:30px">
    <div style="color:#b388ff;letter-spacing:2px;font-size:12px">SHOPDIRECT / P3.1 / ИЗВЕСТИЕ</div>
    <h1 style="margin:12px 0;font-size:28px">Нов посетител</h1>
    <p style="color:#c5b5dc">Посетителът изпрати данните си доброволно при отваряне на курсовата работа.</p>
    <div style="background:#291947;padding:20px;border-radius:14px">
    <p><strong>Имена:</strong> {clean_name}</p>
    <p><strong>Имейл:</strong> {clean_email}</p>
    <p><strong>Време:</strong> {stamp}</p></div>
    <p><a href="https://shopdirect-nine.vercel.app/" style="color:#c4a4ff">Отвори курсовата работа ↗</a></p>
    <small style="color:#afa0c8">Известие за посещение, не потвърдена самоличност. Данните не се съхраняват в база на сайта.</small>
    </div></body></html>"""
    return subject, plain, html

def send_resend(cfg, name, email):
    subject, plain, html = compose_notification(name, email, datetime.now(timezone.utc))
    body = json.dumps({
        "from": cfg["sender"],
        "to": [cfg["recipient"]],
        "subject": subject,
        "text": plain,
        "html": html,
        "reply_to": email
    }, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        "https://api.resend.com/emails", data=body, method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + cfg["key"],
            "User-Agent": "ShopDirect-P31-Visitor-Register/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        result = json.loads(response.read(4096).decode("utf-8"))
        if not response.status in (200, 201, 202) or not result.get("id"):
            raise RuntimeError("Неуспешно потвърждение от пощенската услуга.")
    return True

def allow_rate(request):
    # Hash is intentionally not stored, and IP is never sent in notification.
    # Note: per-instance throttle only; Vercel WAF is required for strong anti-abuse.
    address = request.client_address[0] if request.client_address else "unknown"
    now = time.monotonic()
    with _RATE_LOCK:
        if len(_RATE_GUARD) > 1000:
            _RATE_GUARD.clear()
        entries = [t for t in _RATE_GUARD.get(address, []) if now - t < _RATE_WINDOW]
        if len(entries) >= _RATE_MAX:
            _RATE_GUARD[address] = entries
            return False
        entries.append(now)
        _RATE_GUARD[address] = entries
        return True

class handler(BaseHTTPRequestHandler):
    def reply(self, status, value):
        raw = json.dumps(value, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        for key, val in (
            ("Content-Type", "application/json; charset=utf-8"),
            ("Cache-Control", "no-store"),
            ("X-Content-Type-Options", "nosniff"),
            ("X-Robots-Tag", "noindex"),
            ("Content-Security-Policy", "default-src 'none'"),
            ("Content-Length", str(len(raw))),
        ):
            self.send_header(key, val)
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        # Public capability check; no account identifiers or credentials returned.
        self.reply(200, {
            "service": "visitor-notification",
            "email_enabled": settings()["enabled"],
            "method": "explicit consent before sending",
            "collects": ["full_name", "email"],
        })

    def do_POST(self):
        cfg = settings()
        if not cfg["enabled"]:
            return self.reply(503, {
                "error": "Известията още не са конфигурирани. Можете да продължите без регистрация.",
                "code": "EMAIL_NOT_CONFIGURED",
            })
        origin = self.headers.get("Origin", "")
        host = self.headers.get("Host", "")
        if origin and urlparse(origin).netloc != host:
            return self.reply(403, {"error": "Невалиден източник на заявката."})
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self.reply(400, {"error": "Невалидна заявка."})
        if not (2 <= length <= MAX_PAYLOAD):
            return self.reply(413, {"error": "Невалиден размер на заявката."})
        if "application/json" not in self.headers.get("Content-Type", ""):
            return self.reply(415, {"error": "Очаква се application/json."})
        try:
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError("Невалидни данни.")
            # Bots fill the off-screen honeypot; never send their submissions.
            if payload.get("website"):
                return self.reply(200, {"ok": True, "notified": False})
            if payload.get("consent") is not True:
                raise ValueError("Изисква се изрично съгласие за известието.")
            name = validate_name(payload.get("full_name", ""))
            email = validate_email(payload.get("email", ""))
        except (ValueError, UnicodeError, TypeError):
            return self.reply(400, {"error": "Проверете имената, имейла и съгласието."})
        if not allow_rate(self):
            return self.reply(429, {"error": "Твърде много опити. Моля, опитайте по-късно."})
        try:
            send_resend(cfg, name, email)
            return self.reply(200, {"ok": True, "notified": True})
        except (urllib.error.URLError, TimeoutError, RuntimeError, OSError):
            # Neither credentials nor visitor personal data are logged.
            return self.reply(502, {
                "error": "Пощенската услуга не потвърди доставянето на заявката. Опитайте по-късно.",
                "code": "EMAIL_DELIVERY_FAILED",
            })

    def log_message(self, format, *args):
        return
