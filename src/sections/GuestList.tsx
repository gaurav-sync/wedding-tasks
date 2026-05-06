import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Phone, MessageSquare, XCircle, HelpCircle, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { trpc } from '@/providers/trpc';
import type { GuestGroup, GuestStatus } from '@/types';

const STATUS_CONFIG: Record<GuestStatus, { color: string; icon: React.ReactNode }> = {
  'Not Contacted': { color: 'bg-[#52525B] text-white', icon: <HelpCircle className="h-3 w-3" /> },
  Texted: { color: 'bg-[#8B5CF6] text-white', icon: <MessageSquare className="h-3 w-3" /> },
  Called: { color: 'bg-[#3B82F6] text-white', icon: <Phone className="h-3 w-3" /> },
  Declined: { color: 'bg-[#EF4444] text-white', icon: <XCircle className="h-3 w-3" /> },
};

const GROUPS: GuestGroup[] = ['Friends', 'Family', 'Work', 'Other'];
const STATUSES: GuestStatus[] = ['Not Contacted', 'Texted', 'Called', 'Declined'];

export function GuestList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GuestStatus>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: '',
    phone: '',
    group: 'Friends' as GuestGroup,
    status: 'Not Contacted' as GuestStatus,
  });
  const [addError, setAddError] = useState('');

  const utils = trpc.useUtils();
  const { data: guests = [] } = trpc.guest.list.useQuery();
  const createGuest = trpc.guest.create.useMutation({
    onSuccess: () => {
      utils.guest.list.invalidate();
      setNewGuest({ name: '', phone: '', group: 'Friends', status: 'Not Contacted' });
      setIsOpen(false);
    },
    onError: (err) => setAddError(err.message),
  });
  const updateGuest = trpc.guest.update.useMutation({ onSuccess: () => utils.guest.list.invalidate() });
  const deleteGuestMut = trpc.guest.delete.useMutation({ onSuccess: () => utils.guest.list.invalidate() });

  const filtered = guests.filter((g) => {
    if (statusFilter !== 'all' && g.status !== statusFilter) return false;
    return (
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search) ||
      g.group.toLowerCase().includes(search.toLowerCase())
    );
  });

  const notContacted = guests.filter((g) => g.status === 'Not Contacted').length;
  const texted = guests.filter((g) => g.status === 'Texted').length;
  const called = guests.filter((g) => g.status === 'Called').length;
  const declined = guests.filter((g) => g.status === 'Declined').length;

  const addGuest = () => {
    if (!newGuest.name.trim()) return;
    setAddError('');
    createGuest.mutate({
      name: newGuest.name.trim(),
      phone: newGuest.phone.trim() || undefined,
      group: newGuest.group,
      status: newGuest.status,
    });
  };

  const deleteGuest = (id: string) => {
    deleteGuestMut.mutate({ id });
  };

  const cycleStatus = (id: string, currentStatus: GuestStatus) => {
    const idx = STATUSES.indexOf(currentStatus);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    updateGuest.mutate({ id, status: next });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0px_4px_12px_rgba(255,255,255,0.05)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-white">
            Guest List
          </h2>
          <p className="mt-0.5 text-xs text-[#71717A]">Your personal list — not shared with your partner&apos;s account.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-[#52525B]/50 text-[#A1A1AA]">
            {notContacted} Not contacted
          </Badge>
          <Badge variant="outline" className="border-[#8B5CF6]/30 text-[#A78BFA]">
            {texted} Texted
          </Badge>
          <Badge variant="outline" className="border-[#3B82F6]/30 text-[#60A5FA]">
            {called} Called
          </Badge>
          <Badge variant="outline" className="border-[#EF4444]/30 text-[#F87171]">
            {declined} Declined
          </Badge>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative min-w-0 flex-1 sm:min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52525B]" />
          <Input
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-white/10 bg-[#050505] pl-9 text-white placeholder:text-[#52525B]"
          />
        </div>
        <div className="relative flex min-w-0 items-center gap-2 sm:w-auto sm:min-w-[200px]">
          <Filter className="hidden h-4 w-4 shrink-0 text-[#52525B] sm:block" />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as 'all' | GuestStatus)}
          >
            <SelectTrigger className="w-full border-white/10 bg-[#050505] text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#1A1A1A] text-white">
              <SelectItem value="all" className="focus:bg-white/10 focus:text-white">
                All statuses
              </SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-white/10 focus:text-white">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setAddError(''); }}>
          <DialogTrigger asChild>
            <Button className="shrink-0 bg-white text-black hover:bg-white/90 sm:ml-auto">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-[#121212] text-white">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Add Guest</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Guest name"
                value={newGuest.name}
                onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                className="border-white/10 bg-[#050505] text-white placeholder:text-[#52525B]"
              />
              <Input
                placeholder="Phone number"
                value={newGuest.phone}
                onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                className="border-white/10 bg-[#050505] text-white placeholder:text-[#52525B]"
              />
              <Select
                value={newGuest.group}
                onValueChange={(v) => setNewGuest({ ...newGuest, group: v as GuestGroup })}
              >
                <SelectTrigger className="border-white/10 bg-[#050505] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#1A1A1A] text-white">
                  {GROUPS.map((g) => (
                    <SelectItem key={g} value={g} className="focus:bg-white/10 focus:text-white">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addError && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {addError}
                </p>
              )}
              <Button
                onClick={addGuest}
                disabled={createGuest.isPending}
                className="bg-white text-black hover:bg-white/90 disabled:opacity-50"
              >
                {createGuest.isPending ? 'Adding…' : 'Add Guest'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#1A1A1A] text-xs uppercase tracking-wider text-[#A1A1AA]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {filtered.map((guest) => {
                const config = STATUS_CONFIG[guest.status as GuestStatus];
                return (
                  <motion.tr
                    key={guest.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium text-white">{guest.name}</td>
                    <td className="px-4 py-3 text-[#A1A1AA]">{guest.phone}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-[#A1A1AA]">
                        {guest.group}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => cycleStatus(guest.id, guest.status as GuestStatus)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-300 ${config.color}`}
                      >
                        {config.icon}
                        {guest.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteGuest(guest.id)}
                        className="rounded-md p-1.5 text-[#52525B] opacity-0 transition-colors hover:bg-[#EF4444]/10 hover:text-[#EF4444] group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-[#52525B]">
            {guests.length === 0
              ? 'No guests yet. Add your first guest!'
              : 'No guests match your search or status filter.'}
          </div>
        )}
      </div>
    </div>
  );
}
