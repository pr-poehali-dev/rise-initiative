import json
import os
import psycopg2  # noqa: psycopg2-binary
from datetime import datetime

SCHEMA = "t_p178262_rise_initiative"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_from_session(cur, session_id):
    cur.execute(
        f"SELECT u.id, u.name, u.email FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """CRUD задач: создание, чтение, обновление, удаление, назначение ответственных и тегов."""
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
    session_id = event.get("headers", {}).get("X-Session-Id", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user_from_session(cur, session_id)
        if not user:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}

        user_id = user[0]

        # GET /tasks — список задач
        if method == "GET" and (path.endswith("/tasks") or path.endswith("/tasks/")):
            cur.execute(f"""
                SELECT t.id, t.title, t.description, t.status, t.priority,
                       t.due_date, t.created_at, t.created_by,
                       u.name as creator_name
                FROM {SCHEMA}.tasks t
                LEFT JOIN {SCHEMA}.users u ON t.created_by = u.id
                ORDER BY t.created_at DESC
            """)
            rows = cur.fetchall()
            tasks = []
            for r in rows:
                task_id = r[0]
                cur.execute(f"""
                    SELECT u.id, u.name, u.email FROM {SCHEMA}.task_assignees ta
                    JOIN {SCHEMA}.users u ON ta.user_id = u.id
                    WHERE ta.task_id = %s
                """, (task_id,))
                assignees = [{"id": a[0], "name": a[1], "email": a[2]} for a in cur.fetchall()]

                cur.execute(f"""
                    SELECT tg.id, tg.name, tg.color FROM {SCHEMA}.task_tags tt
                    JOIN {SCHEMA}.tags tg ON tt.tag_id = tg.id
                    WHERE tt.task_id = %s
                """, (task_id,))
                tags = [{"id": tg[0], "name": tg[1], "color": tg[2]} for tg in cur.fetchall()]

                tasks.append({
                    "id": task_id,
                    "title": r[1],
                    "description": r[2],
                    "status": r[3],
                    "priority": r[4],
                    "due_date": r[5].isoformat() if r[5] else None,
                    "created_at": r[6].isoformat() if r[6] else None,
                    "created_by": r[7],
                    "creator_name": r[8],
                    "assignees": assignees,
                    "tags": tags,
                })
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"tasks": tasks})}

        # POST /tasks — создать задачу
        if method == "POST" and (path.endswith("/tasks") or path.endswith("/tasks/")):
            title = body.get("title", "").strip()
            if not title:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Название обязательно"})}

            description = body.get("description", "")
            status = body.get("status", "todo")
            priority = body.get("priority", "medium")
            due_date = body.get("due_date") or None
            assignee_ids = body.get("assignee_ids", [])
            tag_names = body.get("tags", [])

            cur.execute(
                f"INSERT INTO {SCHEMA}.tasks (title, description, status, priority, due_date, created_by) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (title, description, status, priority, due_date, user_id)
            )
            task_id = cur.fetchone()[0]

            for uid in assignee_ids:
                cur.execute(f"INSERT INTO {SCHEMA}.task_assignees (task_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (task_id, uid))

            for tag_name in tag_names:
                tag_name = tag_name.strip()
                if tag_name:
                    cur.execute(f"INSERT INTO {SCHEMA}.tags (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", (tag_name,))
                    tag_id = cur.fetchone()[0]
                    cur.execute(f"INSERT INTO {SCHEMA}.task_tags (task_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (task_id, tag_id))

            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"id": task_id})}

        # PUT /tasks/{id} — обновить задачу
        parts = path.rstrip("/").split("/")
        if method == "PUT" and len(parts) >= 2 and parts[-2] in ("tasks",):
            task_id = int(parts[-1])
            fields = []
            values = []
            for f in ["title", "description", "status", "priority", "due_date"]:
                if f in body:
                    fields.append(f"{f} = %s")
                    values.append(body[f] or None if f == "due_date" else body[f])
            fields.append("updated_at = NOW()")
            if fields:
                values.append(task_id)
                cur.execute(f"UPDATE {SCHEMA}.tasks SET {', '.join(fields)} WHERE id = %s", values)

            if "assignee_ids" in body:
                cur.execute(f"SELECT id FROM {SCHEMA}.task_assignees WHERE task_id = %s", (task_id,))
                existing = {r[0] for r in cur.fetchall()}
                new_ids = set(body["assignee_ids"])
                for uid in new_ids - existing:
                    cur.execute(f"INSERT INTO {SCHEMA}.task_assignees (task_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (task_id, uid))

            if "tags" in body:
                cur.execute(f"SELECT tt.tag_id FROM {SCHEMA}.task_tags tt WHERE tt.task_id = %s", (task_id,))
                old_tag_ids = [r[0] for r in cur.fetchall()]
                for tid in old_tag_ids:
                    cur.execute(f"UPDATE {SCHEMA}.task_tags SET task_id = task_id WHERE task_id = %s AND tag_id = %s", (task_id, tid))
                cur.execute(f"DELETE FROM {SCHEMA}.task_tags WHERE task_id = %s", (task_id,))
                for tag_name in body["tags"]:
                    tag_name = tag_name.strip()
                    if tag_name:
                        cur.execute(f"INSERT INTO {SCHEMA}.tags (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", (tag_name,))
                        tag_id = cur.fetchone()[0]
                        cur.execute(f"INSERT INTO {SCHEMA}.task_tags (task_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (task_id, tag_id))

            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # DELETE /tasks/{id}
        if method == "DELETE" and len(parts) >= 2 and parts[-2] in ("tasks",):
            task_id = int(parts[-1])
            cur.execute(f"UPDATE {SCHEMA}.tasks SET status = 'archived' WHERE id = %s", (task_id,))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # GET /tags
        if method == "GET" and path.endswith("/tags"):
            cur.execute(f"SELECT id, name, color FROM {SCHEMA}.tags ORDER BY name")
            tags = [{"id": r[0], "name": r[1], "color": r[2]} for r in cur.fetchall()]
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"tags": tags})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()