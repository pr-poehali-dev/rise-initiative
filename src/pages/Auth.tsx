import { useState } from "react";
import { login, register, SESSION_KEY } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onAuth: () => void;
}

export default function Auth({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await login(email, password);
      } else {
        if (!name.trim()) {
          toast({ title: "Введите имя", variant: "destructive" });
          return;
        }
        data = await register(name, email, password);
      }
      if (data.error) {
        toast({ title: data.error, variant: "destructive" });
        return;
      }
      localStorage.setItem(SESSION_KEY, data.session_id);
      onAuth();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="https://cdn.poehali.dev/projects/47894456-eccd-4236-bbf3-c14775d7fbbb/bucket/761c078d-2930-4823-939c-d359d8ce31a2.png"
            alt="Логотип"
            className="w-16 h-16 object-contain mx-auto mb-4 grayscale"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">Задачник</h1>
          <p className="text-muted-foreground">Управляйте задачами вместе с командой</p>
        </div>

        <div className="rounded-2xl overflow-hidden mb-6">
          <img
            src="https://cdn.poehali.dev/projects/47894456-eccd-4236-bbf3-c14775d7fbbb/bucket/a11ee149-b55a-46a7-b3cc-9432c62fecb4.jpg"
            alt="А спонсор сегодняшнего дня"
            className="w-full object-cover max-h-64"
          />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex rounded-lg overflow-hidden border border-border mb-6">
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("login")}
            >
              Вход
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("register")}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Имя</label>
                <Input
                  placeholder="Иван Иванов"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Пароль</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}