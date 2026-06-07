import { motion, useReducedMotion } from 'framer-motion';

const MiniTrend = ({ data = [], width = 140, height = 40, color = 'var(--blue)' }) => {
  const shouldReduce = useReducedMotion();

  if (!data.length) {
    return <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No data</div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * (width - 4) + 2;
      const y = height - ((value - min) / range) * (height - 6) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <motion.polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: {
            duration: shouldReduce ? 0 : 1.0,
            ease: 'easeOut',
            delay: 0.2
          },
          opacity: {
            duration: shouldReduce ? 0 : 0.4,
            delay: 0.2
          }
        }}
        style={{ vectorEffect: 'non-scaling-stroke' }}
      />
      <circle cx={2} cy={height - 2} r="1" fill={color} />
    </motion.svg>
  );
};

export default MiniTrend;
