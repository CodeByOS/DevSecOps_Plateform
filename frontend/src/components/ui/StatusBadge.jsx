import { motion } from 'framer-motion';

const StatusBadge = ({ status }) => {
  const map = {
    blocked:   { bg: 'bg-brand-red/10',    fg: 'text-brand-red',    border: 'border-brand-red/30' },
    failed:    { bg: 'bg-brand-red/10',    fg: 'text-brand-red',    border: 'border-brand-red/30' },
    completed: { bg: 'bg-brand-green/10',  fg: 'text-brand-green',  border: 'border-brand-green/30' },
    approved:  { bg: 'bg-brand-green/10',  fg: 'text-brand-green',  border: 'border-brand-green/30' },
    pending:   { bg: 'bg-brand-blue/10',   fg: 'text-brand-blue',   border: 'border-brand-blue/30' },
    running:   { bg: 'bg-brand-orange/10', fg: 'text-brand-orange', border: 'border-brand-orange/30' },
  };

  const colors = map[status] ?? { bg: 'bg-bg-elevated', fg: 'text-text-muted', border: 'border-border-main' };
  const isRunning = status === 'running';

  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest
        inline-flex items-center gap-2 min-w-[90px] justify-center shadow-sm transition-all
        ${colors.bg} ${colors.fg} ${colors.border}
      `}
    >
      {isRunning && (
        <motion.span 
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]"
        />
      )}
      {status ?? 'unknown'}
    </motion.span>
  );
};

export default StatusBadge;
