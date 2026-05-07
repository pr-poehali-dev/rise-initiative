CREATE TABLE IF NOT EXISTS t_p178262_rise_initiative.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p178262_rise_initiative.sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER REFERENCES t_p178262_rise_initiative.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS t_p178262_rise_initiative.tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'medium',
  due_date DATE,
  created_by INTEGER REFERENCES t_p178262_rise_initiative.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p178262_rise_initiative.task_assignees (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES t_p178262_rise_initiative.tasks(id),
  user_id INTEGER REFERENCES t_p178262_rise_initiative.users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

CREATE TABLE IF NOT EXISTS t_p178262_rise_initiative.tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(20) DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS t_p178262_rise_initiative.task_tags (
  task_id INTEGER REFERENCES t_p178262_rise_initiative.tasks(id),
  tag_id INTEGER REFERENCES t_p178262_rise_initiative.tags(id),
  PRIMARY KEY (task_id, tag_id)
);
