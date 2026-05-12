import { motion } from 'framer-motion';

const Skeleton = ({ width, height, borderRadius = 12, style }) => (
  <motion.div
    initial={{ opacity: 0.5 }}
    animate={{ opacity: [0.5, 0.8, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    style={{
      width: width ?? '100%',
      height: height ?? 20,
      borderRadius,
      background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
      backgroundSize: '200% 100%',
      ...style
    }}
  >
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
      }}
    />
  </motion.div>
);

export default Skeleton;
