import { useState, useEffect } from "react";
import { createTask, updateTask, sendNotify, getUsers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/components/TaskCard";
import Icon from "@/components/ui/icon";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Props {
  task?: Task | null;
  onClose: () => void;
  onSaved: () => void;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
];

const STATUS_OPTIONS = [
  { value: "todo", label: "К выполнению" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Готово" },
];

const TAG_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export default function TaskModal({ task, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState(task?.status || "todo");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [dueDate, setDueDate] = useState(task?.due_date || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(task?.tags.map(t => t.name) || []);
  const [users, setUsers] = useState<User[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<number[]>(task?.assignees.map(a => a.id) || []);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getUsers().then(d => { if (d.users) setUsers(d.users); });
  }, []);

  function addTag() {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function toggleAssignee(id: number) {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast({ title: "Введите название задачи", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = { title, description, status, priority, due_date: dueDate || null, assignee_ids: assigneeIds, tags };
      if (task) {
        await updateTask(task.id, data);
        await sendNotify(task.id, assigneeIds.filter(id => !task.assignees.map(a => a.id).includes(id)));
        toast({ title: "Задача обновлена" });
      } else {
        const res = await createTask(data);
        if (res.id) {
          await sendNotify(res.id, assigneeIds);
        }
        toast({ title: "Задача создана" });
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{task ? "Редактировать задачу" : "Новая задача"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Название *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Название задачи" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Подробное описание задачи"
              rows={3}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Статус</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Приоритет</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Срок выполнения</label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Теги</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="#тег"
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button variant="outline" size="sm" onClick={addTag} type="button">Добавить</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: TAG_COLORS[i % TAG_COLORS.length] }}>
                  #{tag}
                  <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:opacity-70">
                    <Icon name="X" size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Ответственные</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {users.map(u => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded px-2 py-1 transition-colors">
                    <input
                      type="checkbox"
                      checked={assigneeIds.includes(u.id)}
                      onChange={() => toggleAssignee(u.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{u.name}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <Button variant="outline" onClick={onClose} className="flex-1">Отмена</Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
