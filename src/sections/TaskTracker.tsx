import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Circle, User, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/providers/trpc';

export function TaskTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    assignee: '',
    dueDate: '',
  });

  const utils = trpc.useUtils();
  const { data: tasks = [] } = trpc.task.list.useQuery();
  const createTask = trpc.task.create.useMutation({ onSuccess: () => utils.task.list.invalidate() });
  const toggleTask = trpc.task.toggle.useMutation({ onSuccess: () => utils.task.list.invalidate() });
  const deleteTaskMut = trpc.task.delete.useMutation({ onSuccess: () => utils.task.list.invalidate() });

  const completed = tasks.filter((t) => t.isCompleted).length;
  const pending = tasks.filter((t) => !t.isCompleted).length;

  const addTask = () => {
    if (!newTask.title.trim()) return;
    createTask.mutate({
      title: newTask.title.trim(),
      assignee: newTask.assignee.trim() || 'Me',
      dueDate: newTask.dueDate || undefined,
    });
    setNewTask({ title: '', assignee: '', dueDate: '' });
    setIsOpen(false);
  };

  const toggle = (id: string) => {
    toggleTask.mutate({ id });
  };

  const deleteTask = (id: string) => {
    deleteTaskMut.mutate({ id });
  };

  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0px_4px_12px_rgba(255,255,255,0.05)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-white">
          Tasks & Delegation
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-[#22C55E]/30 text-[#22C55E]">
            {completed} Done
          </Badge>
          <Badge variant="outline" className="border-[#F59E0B]/30 text-[#F59E0B]">
            {pending} Pending
          </Badge>
        </div>
      </div>

      <div className="mb-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 hover:text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Task or Request
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-[#121212] text-white">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">New Task</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="What needs to be done?"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="border-white/10 bg-[#050505] text-white placeholder:text-[#52525B]"
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Assign to (e.g., Mom, Best Man)"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  className="border-white/10 bg-[#050505] text-white placeholder:text-[#52525B]"
                />
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="border-white/10 bg-[#050505] text-white"
                />
              </div>
              <Button onClick={addTask} className="bg-white text-black hover:bg-white/90">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="max-h-[350px] space-y-2 overflow-y-auto">
        <AnimatePresence>
          {tasks.map((task) => {
            const overdue = !task.isCompleted && isOverdue(task.dueDate);
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`group flex items-start gap-3 rounded-xl border p-4 transition-all duration-300 ${
                  task.isCompleted
                    ? 'border-[#22C55E]/20 bg-[#22C55E]/5'
                    : overdue
                      ? 'border-[#EF4444]/20 bg-[#EF4444]/5'
                      : 'border-white/5 bg-[#050505] hover:border-white/10'
                }`}
              >
                <button
                  onClick={() => toggle(task.id)}
                  className="mt-0.5 text-[#52525B] transition-colors hover:text-white"
                >
                  {task.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium transition-all duration-300 ${
                      task.isCompleted ? 'text-[#52525B] line-through' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-3">
                    {task.assignee && (
                      <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white">
                          <User className="h-3 w-3" />
                        </div>
                        {task.assignee}
                      </div>
                    )}
                    {task.dueDate && (
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          overdue ? 'text-[#EF4444]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        <CalendarDays className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="rounded-md p-1.5 text-[#52525B] opacity-0 transition-colors hover:bg-[#EF4444]/10 hover:text-[#EF4444] group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="py-8 text-center text-sm text-[#52525B]">
            No tasks yet. Delegate work to stay organized!
          </div>
        )}
      </div>
    </div>
  );
}
