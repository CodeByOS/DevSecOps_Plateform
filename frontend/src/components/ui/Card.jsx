import { motion } from 'framer-motion';

const Card = ({ children, className = '', hover = true, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    whileHover={hover ? { 
      y: -4, 
      transition: { duration: 0.2 }
    } : {}}
    className={`
      relative overflow-hidden bg-bg-card border border-border-main rounded-2xl p-6
      shadow-lg shadow-black/20 transition-colors duration-300
      ${hover ? 'hover:border-brand-blue/30 hover:shadow-brand-blue/5' : ''}
      ${className}
    `}
    {...props}
  >
    {/* Subtle inner glow for depth */}
    <div className="absolute inset-px rounded-[15px] border border-white/5 pointer-events-none" />
    
    {/* Decorative sheen effect on hover */}
    {hover && (
      <div 
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
      />
    )}
    
    {children}
  </motion.div>
);

export default Card;
