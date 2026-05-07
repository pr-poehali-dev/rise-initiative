import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta

SCHEMA = "t_p178262_rise_initiative"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    """Регистрация, вход и выход пользователей. Управление сессиями."""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod")
    path = event.get("path", "")
    body = json.loads(event.get("body") or "{}")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # POST /register
        if method == "POST" and path.endswith("/register"):
            name = body.get("name", "").strip()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")

            if not name or not email or not password:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполните все поля"})}

            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            if cur.fetchone():
                return {"statusCode": 409, "headers": headers, "body": json.dumps({"error": "Email уже зарегистрирован"})}

            cur.execute(
                f"INSERT INTO {SCHEMA}.users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id, name, email",
                (name, email, hash_password(password))
            )
            user = cur.fetchone()
            conn.commit()

            session_id = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=30)
            cur.execute(
                f"INSERT INTO {SCHEMA}.sessions (id, user_id, expires_at) VALUES (%s, %s, %s)",
                (session_id, user[0], expires)
            )
            conn.commit()

            return {
                "statusCode": 201,
                "headers": headers,
                "body": json.dumps({"session_id": session_id, "user": {"id": user[0], "name": user[1], "email": user[2]}})
            }

        # POST /login
        if method == "POST" and path.endswith("/login"):
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")

            cur.execute(f"SELECT id, name, email FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s", (email, hash_password(password)))
            user = cur.fetchone()
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Неверный email или пароль"})}

            session_id = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=30)
            cur.execute(
                f"INSERT INTO {SCHEMA}.sessions (id, user_id, expires_at) VALUES (%s, %s, %s)",
                (session_id, user[0], expires)
            )
            conn.commit()

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"session_id": session_id, "user": {"id": user[0], "name": user[1], "email": user[2]}})
            }

        # GET /me
        if method == "GET" and path.endswith("/me"):
            session_id = event.get("headers", {}).get("X-Session-Id", "")
            if not session_id:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}

            cur.execute(
                f"SELECT u.id, u.name, u.email FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
                (session_id,)
            )
            user = cur.fetchone()
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия истекла"})}

            return {"statusCode": 200, "headers": headers, "body": json.dumps({"user": {"id": user[0], "name": user[1], "email": user[2]}})}

        # POST /logout
        if method == "POST" and path.endswith("/logout"):
            session_id = event.get("headers", {}).get("X-Session-Id", "")
            if session_id:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
                conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # GET /users — список всех пользователей для назначения
        if method == "GET" and path.endswith("/users"):
            session_id = event.get("headers", {}).get("X-Session-Id", "")
            cur.execute(
                f"SELECT u.id FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
                (session_id,)
            )
            if not cur.fetchone():
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}

            cur.execute(f"SELECT id, name, email FROM {SCHEMA}.users ORDER BY name")
            users = [{"id": r[0], "name": r[1], "email": r[2]} for r in cur.fetchall()]
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"users": users})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()
