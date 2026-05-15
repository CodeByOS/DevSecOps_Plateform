import { motion } from 'framer-motion';

const Skeleton = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0.3 }}
    animate={{ opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    className={`bg-bg-elevated rounded-xl relative overflow-hidden ${className}`}
  >
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
    />
  </motion.div>
);

export default Skeleton;
