import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ShoppingBag, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/providers/trpc';
import type { ShoppingCategory } from '@/types';

const CATEGORIES: ShoppingCategory[] = ['Decor', 'Attire', 'Venue', 'Catering', 'Gifts', 'Misc'];

export function ShoppingList() {
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState<ShoppingCategory>('Decor');

  const utils = trpc.useUtils();
  const { data: items = [] } = trpc.shopping.list.useQuery();
  const createItem = trpc.shopping.create.useMutation({ onSuccess: () => utils.shopping.list.invalidate() });
  const toggleItem = trpc.shopping.toggle.useMutation({ onSuccess: () => utils.shopping.list.invalidate() });
  const deleteItemMut = trpc.shopping.delete.useMutation({ onSuccess: () => utils.shopping.list.invalidate() });

  const purchased = items.filter((i) => i.isPurchased).length;
  const progress = items.length > 0 ? Math.round((purchased / items.length) * 100) : 0;

  const addItem = () => {
    if (!newItem.trim()) return;
    createItem.mutate({ itemName: newItem.trim(), category: newCategory });
    setNewItem('');
  };

  const toggle = (id: string) => {
    toggleItem.mutate({ id });
  };

  const deleteItem = (id: string) => {
    deleteItemMut.mutate({ id });
  };

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0px_4px_12px_rgba(255,255,255,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-white">
          Shopping List
        </h2>
        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <ShoppingBag className="h-4 w-4" />
          <span>
            {purchased} / {items.length} items
          </span>
        </div>
      </div>

      <div className="mb-4">
        <Progress value={progress} className="h-2 bg-[#1A1A1A]" />
        <p className="mt-1 text-right text-xs text-[#A1A1AA]">{progress}% complete</p>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Add an item to buy..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          className="flex-1 border-white/10 bg-[#050505] text-white placeholder:text-[#52525B]"
        />
        <Select value={newCategory} onValueChange={(v) => setNewCategory(v as ShoppingCategory)}>
          <SelectTrigger className="w-[130px] border-white/10 bg-[#050505] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#1A1A1A] text-white">
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="focus:bg-white/10 focus:text-white">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={addItem} className="bg-white text-black hover:bg-white/90">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-[300px] space-y-4 overflow-y-auto">
        <AnimatePresence>
          {grouped.map(({ category, items: catItems }) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#52525B]">
                {category}
              </h3>
              <div className="space-y-1">
                {catItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    className="group flex items-center gap-3 rounded-lg border border-white/5 bg-[#050505] p-3 hover:border-white/10"
                  >
                    <button
                      onClick={() => toggle(item.id)}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300 ${
                        item.isPurchased
                          ? 'border-[#22C55E] bg-[#22C55E]'
                          : 'border-[#52525B] hover:border-white/30'
                      }`}
                    >
                      {item.isPurchased && <Check className="h-3 w-3 text-black" />}
                    </button>
                    <span
                      className={`flex-1 text-sm transition-all duration-500 ${
                        item.isPurchased ? 'text-[#52525B] line-through' : 'text-white'
                      }`}
                    >
                      {item.itemName}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded-md p-1.5 text-[#52525B] opacity-0 transition-colors hover:bg-[#EF4444]/10 hover:text-[#EF4444] group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div className="py-8 text-center text-sm text-[#52525B]">
            No items yet. Start adding things you need to buy!
          </div>
        )}
      </div>
    </div>
  );
}
