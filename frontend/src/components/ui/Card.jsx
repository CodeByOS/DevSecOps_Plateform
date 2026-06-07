import { motion, useReducedMotion } from 'framer-motion';

const Card = ({ children, style, hover = true, delay = 0, ...props }) => {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduce ? 0 : 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={hover ? { 
        y: shouldReduce ? 0 : -4, 
        borderColor: 'var(--blue)', 
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(79, 163, 255, 0.1)' 
      } : {}}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      {/* Enhanced shimmer effect on hover */}
      {hover && (
        <>
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
              pointerEvents: 'none'
            }}
          />
          <motion.div
            className="shimmer-overlay"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
              pointerEvents: 'none',
              skewX: -25
            }}
          />
        </>
      )}
      {children}
    </motion.div>
  );
};

export default Card;
