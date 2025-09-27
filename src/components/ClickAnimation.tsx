
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
    // Don't trigger animations for clicks on buttons or links to avoid distraction
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
        return;
    }

    const newBubbles: Bubble[] = [];
    
    // Create a burst of 12 bubbles
    for (let i = 0; i < 12; i++) {
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
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
        document.addEventListener('click', addBubble);
        return () => {
            document.removeEventListener('click', addBubble);
        };
    }
  }, [addBubble]);
  
  const onAnimationComplete = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
  };


  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999]">
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ 
                x: bubble.x, 
                y: bubble.y,
                scale: 0.1,
                opacity: 1,
            }}
            animate={{
              x: bubble.x + (Math.random() - 0.5) * 150, // spread further
              y: bubble.y + (Math.random() - 0.5) * 150,
              scale: 1.2,
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
              mixBlendMode: 'screen', // cool effect on dark backgrounds
            }}
            onAnimationComplete={() => onAnimationComplete(bubble.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
