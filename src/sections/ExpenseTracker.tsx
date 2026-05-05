import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, IndianRupee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/providers/trpc';
import type { ExpenseCategory } from '@/types';

function localTodayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const CATEGORIES: ExpenseCategory[] = [
  'Venue',
  'Catering',
  'Attire',
  'Photography',
  'Decor',
  'Entertainment',
  'Gifts',
  'Travel',
  'Invitations',
  'Misc',
];

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
}

type FormState = {
  title: string;
  amountInr: string;
  spentOn: string;
  category: ExpenseCategory;
  notes: string;
};

const emptyForm = (): FormState => ({
  title: '',
  amountInr: '',
  spentOn: localTodayYmd(),
  category: 'Misc',
  notes: '',
});

export function ExpenseTracker() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState('');

  const utils = trpc.useUtils();
  const { data: expenses = [] } = trpc.expense.list.useQuery();
  const createMut = trpc.expense.create.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    },
    onError: (e) => setFormError(e.message),
  });
  const updateMut = trpc.expense.update.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    },
    onError: (e) => setFormError(e.message),
  });
  const deleteMut = trpc.expense.delete.useMutation({
    onSuccess: () => utils.expense.list.invalidate(),
  });

  const totalInr = useMemo(
    () => expenses.reduce((a, e) => a + e.amountInr, 0),
    [expenses],
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const e = expenses.find((x) => x.id === id);
    if (!e) return;
    setEditingId(id);
    setForm({
      title: e.title,
      amountInr: String(e.amountInr),
      spentOn: e.spentOn,
      category: e.category,
      notes: e.notes,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const submit = () => {
    setFormError('');
    const title = form.title.trim();
    if (!title) {
      setFormError('Please enter a title.');
      return;
    }
    const amt = parseFloat(form.amountInr.replace(/,/g, ''));
    if (Number.isNaN(amt) || amt <= 0) {
      setFormError('Enter a valid amount in INR.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.spentOn)) {
      setFormError('Pick a valid date.');
      return;
    }

    if (editingId) {
      updateMut.mutate({
        id: editingId,
        title,
        amountInr: amt,
        spentOn: form.spentOn,
        category: form.category,
        notes: form.notes.trim() || undefined,
      });
    } else {
      createMut.mutate({
        title,
        amountInr: amt,
        spentOn: form.spentOn,
        category: form.category,
        notes: form.notes.trim() || undefined,
      });
    }
  };

  const pending = createMut.isPending || updateMut.isPending;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0px_4px_12px_rgba(255,255,255,0.05)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-white">
          Expense tracker
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400">
            <IndianRupee className="h-3.5 w-3.5" />
            {formatInr(totalInr)} total
          </span>
          <Button
            onClick={openAdd}
            className="bg-white text-black hover:bg-white/90"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add expense
          </Button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#1A1A1A] text-xs uppercase tracking-wider text-[#A1A1AA]">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="hidden px-4 py-3 md:table-cell">Notes</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {expenses.map((e) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="group hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 font-medium text-white">{e.title}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#F5F5F5]">
                    {formatInr(e.amountInr)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#A1A1AA]">
                    {e.spentOn}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-[#A1A1AA]">
                      {e.category}
                    </span>
                  </td>
                  <td className="hidden max-w-[200px] truncate px-4 py-3 text-[#71717A] md:table-cell">
                    {e.notes || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEdit(e.id)}
                        className="rounded-md p-1.5 text-[#52525B] hover:bg-white/10 hover:text-white"
                        aria-label="Edit expense"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMut.mutate({ id: e.id })}
                        className="rounded-md p-1.5 text-[#52525B] hover:bg-[#EF4444]/10 hover:text-[#EF4444]"
                        aria-label="Delete expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div className="py-10 text-center text-sm text-[#52525B]">
            No expenses yet. Add your first entry in INR.
          </div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setEditingId(null);
            setForm(emptyForm());
            setFormError('');
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#121212] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingId ? 'Edit expense' : 'Add expense'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[#A1A1AA]">Name / title</label>
              <Input
                value={form.title}
                onChange={(ev) => setForm({ ...form, title: ev.target.value })}
                placeholder="e.g. Mehendi artist advance"
                className="border-white/10 bg-[#050505] text-white placeholder:text-[#52525B]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#A1A1AA]">Amount (INR)</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.amountInr}
                onChange={(ev) => setForm({ ...form, amountInr: ev.target.value })}
                placeholder="0"
                className="border-white/10 bg-[#050505] text-white placeholder:text-[#52525B]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#A1A1AA]">Date</label>
              <Input
                type="date"
                value={form.spentOn}
                onChange={(ev) => setForm({ ...form, spentOn: ev.target.value })}
                className="border-white/10 bg-[#050505] text-white [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#A1A1AA]">Category</label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm({ ...form, category: v as ExpenseCategory })
                }
              >
                <SelectTrigger className="border-white/10 bg-[#050505] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#1A1A1A] text-white">
                  {CATEGORIES.map((c) => (
                    <SelectItem
                      key={c}
                      value={c}
                      className="focus:bg-white/10 focus:text-white"
                    >
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#A1A1AA]">Notes / description</label>
              <Textarea
                value={form.notes}
                onChange={(ev) => setForm({ ...form, notes: ev.target.value })}
                placeholder="Optional details"
                rows={3}
                className="resize-none border-white/10 bg-[#050505] text-white placeholder:text-[#52525B]"
              />
            </div>
            {formError && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {formError}
              </p>
            )}
            <Button
              onClick={submit}
              disabled={pending}
              className="bg-white text-black hover:bg-white/90 disabled:opacity-50"
            >
              {pending ? 'Saving…' : editingId ? 'Save changes' : 'Add expense'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
