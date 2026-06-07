import { motion, useReducedMotion } from 'framer-motion';

const StatusBadge = ({ status }) => {
  const shouldReduce = useReducedMotion();

  const map = {
    blocked:   { bg: 'var(--red-dim)',    fg: 'var(--red)',    border: 'rgba(241, 122, 95, 0.3)' },
    failed:    { bg: 'var(--red-dim)',    fg: 'var(--red)',    border: 'rgba(241, 122, 95, 0.3)' },
    completed: { bg: 'var(--green-dim)',  fg: 'var(--green)',  border: 'rgba(66, 199, 127, 0.3)' },
    approved:  { bg: 'var(--green-dim)',  fg: 'var(--green)',  border: 'rgba(66, 199, 127, 0.3)' },
    pending:   { bg: 'var(--blue-dim)',   fg: 'var(--blue)',   border: 'rgba(79, 163, 255, 0.3)' },
    running:   { bg: 'var(--orange-dim)', fg: 'var(--orange)', border: 'rgba(232, 168, 68, 0.3)' },
  };

  const colors = map[status] ?? { bg: 'var(--bg-elevated)', fg: 'var(--text-muted)', border: 'var(--border)' };

  const isRunning = status === 'running';

  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        boxShadow: isRunning ? [
          '0 0 0 rgba(232, 168, 68, 0)',
          '0 0 10px rgba(232, 168, 68, 0.3)',
          '0 0 0 rgba(232, 168, 68, 0)'
        ] : '0 0 0 rgba(0,0,0,0)'
      }}
      transition={{ 
        duration: shouldReduce ? 0 : (isRunning ? 2 : 0.3), 
        repeat: isRunning ? Infinity : 0 
      }}
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '5px 10px',
        borderRadius: 20,
        background: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.border}`,
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        textAlign: 'center',
        minWidth: '90px',
        justifyContent: 'center',
        letterSpacing: '0.5px'
      }}
    >
      {isRunning && (
        <motion.span 
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: shouldReduce ? 0 : 1.5, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}
        />
      )}
      {status ?? 'unknown'}
    </motion.span>
  );
};

export default StatusBadge;
