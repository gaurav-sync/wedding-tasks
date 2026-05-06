import { useState } from "react";
import { Countdown } from "@/sections/Countdown";
import { GuestList } from "@/sections/GuestList";
import { ShoppingList } from "@/sections/ShoppingList";
import { ExpenseTracker } from "@/sections/ExpenseTracker";
import { TaskTracker } from "@/sections/TaskTracker";
import { AIChat } from "@/sections/AIChat";
import { Login } from "@/sections/Login";
import { Heart, LogOut } from "lucide-react";
import { trpc } from "@/providers/trpc";

const WEDDING_DATE = new Date("2026-05-10T00:00:00");

export default function App() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("auth_token"),
  );

  const utils = trpc.useUtils();

  const handleLogin = (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    void utils.auth.session.invalidate();
  };

  const { data: session } = trpc.auth.session.useQuery(undefined, {
    enabled: !!token,
  });

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-white" />
            <h1 className="font-serif text-xl font-semibold tracking-wide text-white sm:text-2xl">
              EverAfter
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-[#A1A1AA]">
              May 10, 2026
              {session && (
                <span className="hidden sm:inline">
                  {" "}
                  · <span className="text-white/90">{session.displayName}</span>
                </span>
              )}
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-[#71717A] hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <GuestList />
            <ShoppingList />
            <ExpenseTracker />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <Countdown targetDate={WEDDING_DATE} />
            <TaskTracker />
            <AIChat />
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center">
        <p className="text-xs text-[#52525B]">
          EverAfter Wedding Planner — Your forever starts here
        </p>
      </footer>
    </div>
  );
}
