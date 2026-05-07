import json
import os
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SCHEMA = "t_p178262_rise_initiative"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def send_email(to_email: str, to_name: str, task_title: str, assigned_by: str, due_date: str):
    gmail_user = os.environ.get("GMAIL_USER", "")
    gmail_pass = os.environ.get("GMAIL_APP_PASSWORD", "")
    if not gmail_user or not gmail_pass:
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Вам назначена задача: {task_title}"
    msg["From"] = f"Таск-менеджер <{gmail_user}>"
    msg["To"] = to_email

    due_str = f"<br><b>Срок:</b> {due_date}" if due_date else ""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">Новая задача</h2>
      <p>Привет, <b>{to_name}</b>!</p>
      <p>Пользователь <b>{assigned_by}</b> назначил вам задачу:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <b style="font-size: 18px;">{task_title}</b>{due_str}
      </div>
      <p style="color: #666; font-size: 12px;">Это автоматическое уведомление.</p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(gmail_user, gmail_pass)
        server.sendmail(gmail_user, to_email, msg.as_string())
    return True

def handler(event: dict, context) -> dict:
    """Отправка email-уведомлений при назначении задачи. Вызывается внутренне."""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}

    body = json.loads(event.get("body") or "{}")
    session_id = event.get("headers", {}).get("X-Session-Id", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            f"SELECT u.id, u.name FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
            (session_id,)
        )
        sender = cur.fetchone()
        if not sender:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}

        task_id = body.get("task_id")
        assignee_ids = body.get("assignee_ids", [])

        cur.execute(f"SELECT title, due_date FROM {SCHEMA}.tasks WHERE id = %s", (task_id,))
        task = cur.fetchone()
        if not task:
            return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Задача не найдена"})}

        task_title = task[0]
        due_date = task[1].strftime("%d.%m.%Y") if task[1] else None
        sent = 0

        for uid in assignee_ids:
            cur.execute(f"SELECT name, email FROM {SCHEMA}.users WHERE id = %s", (uid,))
            user = cur.fetchone()
            if user:
                try:
                    send_email(user[1], user[0], task_title, sender[1], due_date)
                    sent += 1
                except Exception:
                    pass

        return {"statusCode": 200, "headers": headers, "body": json.dumps({"sent": sent})}

    finally:
        cur.close()
        conn.close()
