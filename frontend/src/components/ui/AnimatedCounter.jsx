import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/** Animated numeric counter that counts from 0 to the target value on mount */
const AnimatedCounter = ({ value, duration = 0.8 }) => {
  const shouldReduce = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  const numValue = typeof value === 'number' ? value : parseInt(value) || 0;

  useEffect(() => {
    if (shouldReduce) {
      setDisplayValue(numValue);
      return;
    }

    let animationFrame;
    const startTime = Date.now();
    const start = 0;
    const end = numValue;

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const current = Math.floor(start + (end - start) * easeOutQuad);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [numValue, duration, shouldReduce]);

  return <motion.span>{displayValue}</motion.span>;
};

export default AnimatedCounter;
