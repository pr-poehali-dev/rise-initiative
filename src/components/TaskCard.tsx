import { useState } from "react";
import Icon from "@/components/ui/icon";
import { deleteTask, updateTask } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  creator_name?: string;
  assignees: { id: number; name: string; email: string }[];
  tags: { id: number; name: string; color: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  todo: "К выполнению",
  in_progress: "В работе",
  done: "Готово",
  archived: "Архив",
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Низкий", color: "bg-blue-100 text-blue-700" },
  medium: { label: "Средний", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "Высокий", color: "bg-red-100 text-red-700" },
};

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onRefresh: () => void;
}

export default function TaskCard({ task, onEdit, onRefresh }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const prio = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.medium;

  async function handleStatusChange(status: string) {
    setLoading(true);
    await updateTask(task.id, { status });
    await onRefresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Переместить задачу в архив?")) return;
    setLoading(true);
    await deleteTask(task.id);
    toast({ title: "Задача перемещена в архив" });
    await onRefresh();
    setLoading(false);
  }

  const isOverdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();

  return (
    <div className={`bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${isOverdue ? "border-red-300" : "border-border"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-foreground text-sm leading-snug flex-1">{task.title}</h3>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-muted transition-colors" title="Редактировать">
            <Icon name="Pencil" size={14} className="text-muted-foreground" />
          </button>
          <button onClick={handleDelete} disabled={loading} className="p-1 rounded hover:bg-muted transition-colors" title="В архив">
            <Icon name="Archive" size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prio.color}`}>{prio.label}</span>
        {task.tags.map(tag => (
          <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: tag.color }}>
            #{tag.name}
          </span>
        ))}
      </div>

      {task.due_date && (
        <div className={`flex items-center gap-1 text-xs mb-3 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
          <Icon name="Calendar" size={12} />
          <span>{new Date(task.due_date).toLocaleDateString("ru-RU")}</span>
          {isOverdue && <span className="font-medium">(просрочено)</span>}
        </div>
      )}

      {task.assignees.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.assignees.map(a => (
            <span key={a.id} className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              <Icon name="User" size={10} />
              {a.name}
            </span>
          ))}
        </div>
      )}

      <select
        value={task.status}
        onChange={e => handleStatusChange(e.target.value)}
        disabled={loading}
        className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {Object.entries(STATUS_LABELS).filter(([k]) => k !== "archived").map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </div>
  );
}
