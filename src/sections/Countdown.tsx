import { motion } from 'framer-motion';
import { useCountdown } from '@/hooks/useCountdown';
import { Calendar } from 'lucide-react';

interface CountdownProps {
  targetDate: Date;
}

export function Countdown({ targetDate }: CountdownProps) {
  const time = useCountdown(targetDate);

  const units = [
    { label: 'Days', value: time.days },
    { label: 'Hours', value: time.hours },
    { label: 'Minutes', value: time.minutes },
    { label: 'Seconds', value: time.seconds },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0px_4px_12px_rgba(255,255,255,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-white">
          Countdown
        </h2>
        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <Calendar className="h-4 w-4" />
          <span>May 10, 2026</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {units.map((unit) => (
          <motion.div
            key={unit.label}
            className="flex flex-col items-center rounded-xl border border-white/10 bg-[#050505] p-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <span className="font-serif text-3xl font-bold text-white md:text-4xl">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="mt-1 text-xs uppercase tracking-wider text-[#A1A1AA]">
              {unit.label}
            </span>
          </motion.div>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-[#A1A1AA]">
        {time.total <= 0
          ? 'Your special day is here!'
          : 'Every second brings you closer to your forever.'}
      </p>
    </div>
  );
}
