"use client";

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export default function ClickAnimation() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  const addBubble = useCallback((e: MouseEvent) => {
    const newBubbles: Bubble[] = [];
    const size = Math.random() * 20 + 10; // Bubble size between 10 and 30
    
    for (let i = 0; i < 10; i++) {
        newBubbles.push({
            id: Date.now() + i,
            x: e.clientX,
            y: e.clientY,
            size: Math.random() * 15 + 5, // individual bubble size
            duration: Math.random() * 1 + 0.5, // animation duration
            delay: Math.random() * 0.2, // animation delay
        });
    }

    setBubbles(prev => [...prev, ...newBubbles]);

  }, []);

  useEffect(() => {
    document.addEventListener('click', addBubble);
    return () => {
      document.removeEventListener('click', addBubble);
    };
  }, [addBubble]);

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999]">
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ 
                x: bubble.x, 
                y: bubble.y,
                scale: 0,
                opacity: 1,
            }}
            animate={{
              x: bubble.x + (Math.random() - 0.5) * 100,
              y: bubble.y + (Math.random() - 0.5) * 100,
              scale: 1,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: bubble.duration,
              delay: bubble.delay,
              ease: "easeOut",
            }}
            style={{
              position: 'absolute',
              left: -bubble.size / 2,
              top: -bubble.size / 2,
              width: bubble.size,
              height: bubble.size,
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--primary))',
            }}
            onAnimationComplete={() => {
                setBubbles(prev => prev.filter(b => b.id !== bubble.id));
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
