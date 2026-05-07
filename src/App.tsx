import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getMe, SESSION_KEY } from "@/lib/api";
import Auth from "@/pages/Auth";
import Tasks from "@/pages/Tasks";

interface User {
  id: number;
  name: string;
  email: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function checkAuth() {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      setLoading(false);
      return;
    }
    const data = await getMe();
    if (data.user) setUser(data.user);
    setLoading(false);
  }

  useEffect(() => { checkAuth(); }, []);

  function handleAuth() {
    checkAuth();
  }

  function handleLogout() {
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {user ? (
        <Tasks user={user} onLogout={handleLogout} />
      ) : (
        <Auth onAuth={handleAuth} />
      )}
    </TooltipProvider>
  );
};

export default App;
