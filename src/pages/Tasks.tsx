import { useState, useEffect, useCallback } from "react";
import { getTasks, logout } from "@/lib/api";
import TaskCard, { type Task } from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Props {
  user: User;
  onLogout: () => void;
}

const COLUMNS = [
  { key: "todo", label: "К выполнению", color: "bg-slate-100" },
  { key: "in_progress", label: "В работе", color: "bg-blue-50" },
  { key: "done", label: "Готово", color: "bg-green-50" },
];

export default function Tasks({ user, onLogout }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getTasks();
    if (data.tasks) setTasks(data.tasks);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleLogout() {
    await logout();
    onLogout();
  }

  function handleEdit(task: Task) {
    setEditTask(task);
    setShowModal(true);
  }

  function handleCreate() {
    setEditTask(null);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setEditTask(null);
  }

  async function handleSaved() {
    setShowModal(false);
    setEditTask(null);
    await load();
  }

  const filtered = tasks.filter(t => {
    if (t.status === "archived" && !showArchive) return false;
    if (showArchive) return t.status === "archived";
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.poehali.dev/projects/47894456-eccd-4236-bbf3-c14775d7fbbb/bucket/761c078d-2930-4823-939c-d359d8ce31a2.png"
              alt="Логотип"
              className="w-8 h-8 object-contain grayscale"
            />
            <h1 className="text-xl font-bold text-foreground">Задачник</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted">
              <Icon name="LogOut" size={16} />
              <span className="hidden sm:block">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск задач..." className="pl-9" />
          </div>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Все приоритеты</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
          <Button variant="outline" onClick={() => setShowArchive(!showArchive)} className="shrink-0">
            <Icon name={showArchive ? "LayoutDashboard" : "Archive"} size={16} className="mr-2" />
            {showArchive ? "Доска" : "Архив"}
          </Button>
          <Button onClick={handleCreate} className="shrink-0">
            <Icon name="Plus" size={16} className="mr-2" />
            Создать задачу
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : showArchive ? (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Архив</h2>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">Архив пуст</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(t => <TaskCard key={t.id} task={t} onEdit={handleEdit} onRefresh={load} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.key);
              return (
                <div key={col.key} className={`${col.color} rounded-2xl p-4`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm text-foreground">{col.label}</h2>
                    <span className="text-xs bg-white rounded-full px-2 py-0.5 font-medium text-muted-foreground border border-border">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">Нет задач</div>
                    ) : (
                      colTasks.map(t => <TaskCard key={t.id} task={t} onEdit={handleEdit} onRefresh={load} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal task={editTask} onClose={handleModalClose} onSaved={handleSaved} />
      )}
    </div>
  );
}