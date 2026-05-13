import { motion } from 'framer-motion';

const Card = ({ children, style, hover = true, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
    whileHover={hover ? { 
      y: -4, 
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
    {/* Decorative sheen effect */}
    {hover && (
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
    )}
    {children}
  </motion.div>
);

export default Card;
