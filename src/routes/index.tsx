import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, ListTodo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Task Manager — Vazifalarni boshqaring" },
      { name: "description", content: "Oddiy va chiroyli vazifalar boshqaruvchisi. Vazifalar qo'shing, belgilang, filtrlang." },
    ],
  }),
  component: HomePage,
});

type Task = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

type Filter = "all" | "active" | "completed";

function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, completed, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setTasks(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadTasks();
  }, [user, loadTasks]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || !user) return;
    setNewTitle("");
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title, user_id: user.id })
      .select("id, title, completed, created_at")
      .single();
    if (error) {
      toast.error(error.message);
      setNewTitle(title);
    } else if (data) {
      setTasks((prev) => [data, ...prev]);
    }
  };

  const toggleTask = async (task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
    const { error } = await supabase.from("tasks").update({ completed: !task.completed }).eq("id", task.id);
    if (error) {
      toast.error(error.message);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
    }
  };

  const deleteTask = async (id: string) => {
    const prev = tasks;
    setTasks((p) => p.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      setTasks(prev);
    }
  };

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.completed : t.completed
  );
  const activeCount = tasks.filter((t) => !t.completed).length;

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Vazifalaringiz</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeCount} ta aktiv vazifa{activeCount !== 1 ? "" : ""}
          </p>
        </div>

        <Card className="p-2" style={{ boxShadow: "var(--shadow-soft)" }}>
          <form onSubmit={addTask} className="flex gap-2 p-2">
            <Input
              placeholder="Yangi vazifa qo'shing..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button type="submit" size="icon" disabled={!newTitle.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        <div className="mt-4 flex gap-1 rounded-lg bg-muted p-1">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all" ? "Hammasi" : f === "active" ? "Aktiv" : "Bajarilgan"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <ListTodo className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                {filter === "all" ? "Hali vazifa yo'q" : filter === "active" ? "Aktiv vazifalar yo'q" : "Bajarilgan vazifalar yo'q"}
              </p>
            </Card>
          ) : (
            filtered.map((task) => (
              <Card
                key={task.id}
                className="group flex items-center gap-3 p-4 transition-all hover:shadow-md"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task)}
                  className="h-5 w-5"
                />
                <span
                  className={cn(
                    "flex-1 text-sm transition-all",
                    task.completed && "text-muted-foreground line-through"
                  )}
                >
                  {task.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
