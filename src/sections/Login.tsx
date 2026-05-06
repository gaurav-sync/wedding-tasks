import { useState } from "react";
import { Heart, Lock, User } from "lucide-react";
import { trpc } from "@/providers/trpc";

interface LoginProps {
  onLogin: (token: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      void utils.auth.session.invalidate();
      onLogin(data.token);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Heart className="h-8 w-8 text-white mb-3" />
          <h1 className="font-serif text-2xl font-semibold text-white tracking-wide">
            EverAfter
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Wedding Planner</p>
        </div>

        <div className="border border-white/10 rounded-xl p-6 bg-white/[0.03]">
          <h2 className="text-white font-medium mb-6 text-center">
            Sign in to continue
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#A1A1AA] font-medium">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder:text-[#52525B] focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="gauravsapkal or vaibhavsapkal"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#A1A1AA] font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder:text-[#52525B] focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-white text-black font-medium py-2.5 rounded-lg text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
