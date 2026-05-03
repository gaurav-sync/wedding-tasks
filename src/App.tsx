import { Countdown } from '@/sections/Countdown';
import { GuestList } from '@/sections/GuestList';
import { ShoppingList } from '@/sections/ShoppingList';
import { TaskTracker } from '@/sections/TaskTracker';
import { AIChat } from '@/sections/AIChat';
import { Heart } from 'lucide-react';

const WEDDING_DATE = new Date('2026-05-10T00:00:00');

export default function App() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-white" />
            <h1 className="font-serif text-xl font-semibold tracking-wide text-white sm:text-2xl">
              EverAfter
            </h1>
          </div>
          <p className="text-sm text-[#A1A1AA]">May 10, 2026</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left Column - 60% */}
          <div className="space-y-6 lg:col-span-3">
            <GuestList />
            <ShoppingList />
          </div>

          {/* Right Column - 40% */}
          <div className="space-y-6 lg:col-span-2">
            <Countdown targetDate={WEDDING_DATE} />
            <TaskTracker />
            <AIChat />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center">
        <p className="text-xs text-[#52525B]">
          EverAfter Wedding Planner — Your forever starts here
        </p>
      </footer>
    </div>
  );
}
