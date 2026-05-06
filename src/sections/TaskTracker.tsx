import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Circle, User, CalendarDays, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/providers/trpc';
import {
  PARTNER_DISPLAY,
  PARTNER_USERNAMES,
  type PartnerUsername,
} from '@/types';

type OwnerTaskFilter = 'all' | PartnerUsername;

export function TaskTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const [ownerListFilter, setOwnerListFilter] = useState<OwnerTaskFilter>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    assignedTo: 'vaibhavsapkal' as PartnerUsername,
    dueDate: '',
  });

  const utils = trpc.useUtils();
  const { data: session } = trpc.auth.session.useQuery();
  const { data: tasks = [] } = trpc.task.list.useQuery();
  const createTask = trpc.task.create.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });
  const toggleTask = trpc.task.toggle.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });
  const deleteTaskMut = trpc.task.delete.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  const isOwner = session?.role === 'owner';
  const canDeleteTasks = isOwner;

  const visibleTasks = useMemo(() => {
    if (!isOwner || ownerListFilter === 'all') return tasks;
    return tasks.filter((t) => t.assignedTo === ownerListFilter);
  }, [tasks, isOwner, ownerListFilter]);

  const completed = visibleTasks.filter((t) => t.isCompleted).length;
  const pending = visibleTasks.filter((t) => !t.isCompleted).length;

  const defaultAssignee = (): PartnerUsername => {
    if (!session) return 'vaibhavsapkal';
    return session.username === 'gauravsapkal'
      ? 'vaibhavsapkal'
      : 'gauravsapkal';
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    createTask.mutate({
      title: newTask.title.trim(),
      assignedTo: newTask.assignedTo,
      dueDate: newTask.dueDate || undefined,
    });
    setNewTask({ title: '', assignedTo: defaultAssignee(), dueDate: '' });
    setIsOpen(false);
  };

  const toggle = (id: string) => {
    toggleTask.mutate({ id });
  };

  const deleteTask = (id: string) => {
    if (!canDeleteTasks) return;
    deleteTaskMut.mutate({ id });
  };

  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0px_4px_12px_rgba(255,255,255,0.05)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-white">
            Tasks & Delegation
          </h2>
          <p className="mt-1 text-xs text-[#71717A]">
            {isOwner
              ? 'See everyone’s tasks below. Filter by assignee. Only you can delete tasks.'
              : 'Tasks assigned to you. You can mark them done, but not delete them.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-[#22C55E]/30 text-[#22C55E]">
            {completed} Done
          </Badge>
          <Badge variant="outline" className="border-[#F59E0B]/30 text-[#F59E0B]">
            {pending} Pending
          </Badge>
        </div>
      </div>

      {isOwner && (
        <div className="mb-3 flex items-center gap-2">
          <Filter className="hidden h-4 w-4 shrink-0 text-[#52525B] sm:block" />
          <Select
            value={ownerListFilter}
            onValueChange={(v) => setOwnerListFilter(v as OwnerTaskFilter)}
          >
            <SelectTrigger className="max-w-xs border-white/10 bg-[#050505] text-white">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#1A1A1A] text-white">
              <SelectItem value="all" className="focus:bg-white/10 focus:text-white">
                All tasks
              </SelectItem>
              {PARTNER_USERNAMES.map((u) => (
                <SelectItem key={u} value={u} className="focus:bg-white/10 focus:text-white">
                  {PARTNER_DISPLAY[u]} only
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mb-4">
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (open) {
              setNewTask({
                title: '',
                assignedTo: session
                  ? session.username === 'gauravsapkal'
                    ? 'vaibhavsapkal'
                    : 'gauravsapkal'
                  : 'vaibhavsapkal',
                dueDate: '',
              });
            }
          }}
        >
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
              <div className="space-y-1.5">
                <label className="text-xs text-[#A1A1AA]">Assign to</label>
                <Select
                  value={newTask.assignedTo}
                  onValueChange={(v) =>
                    setNewTask({ ...newTask, assignedTo: v as PartnerUsername })
                  }
                >
                  <SelectTrigger className="border-white/10 bg-[#050505] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1A1A1A] text-white">
                    {PARTNER_USERNAMES.map((u) => (
                      <SelectItem
                        key={u}
                        value={u}
                        className="focus:bg-white/10 focus:text-white"
                      >
                        {PARTNER_DISPLAY[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#A1A1AA]">Due date (optional)</label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="border-white/10 bg-[#050505] text-white [color-scheme:dark]"
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
          {visibleTasks.map((task) => {
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
                  type="button"
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
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white">
                        <User className="h-3 w-3" />
                      </div>
                      {task.assignee}
                    </div>
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
                {canDeleteTasks ? (
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="rounded-md p-1.5 text-[#52525B] opacity-0 transition-colors hover:bg-[#EF4444]/10 hover:text-[#EF4444] group-hover:opacity-100"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="w-9 shrink-0" aria-hidden />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {visibleTasks.length === 0 && (
          <div className="py-8 text-center text-sm text-[#52525B]">
            {isOwner
              ? ownerListFilter === 'all'
                ? 'No tasks yet. Add one and assign it to Gaurav or Vaibhav.'
                : `No tasks for ${PARTNER_DISPLAY[ownerListFilter as PartnerUsername] ?? 'this filter'}.`
              : 'No tasks assigned to you yet. Your partner can assign one from their account.'}
          </div>
        )}
      </div>
    </div>
  );
}
