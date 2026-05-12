'use client';

import { useState, useEffect } from 'react';

const EVENT_TYPES = [
  'coffee chat',
  'birthday party',
  'weekly 1:1',
  'team offsite',
  'game night',
  'first date',
  'dinner plans',
  'book club',
];

export function AnimatedEventType() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % EVENT_TYPES.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="inline-block text-amber-500 dark:text-amber-400 transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)' }}
    >
      {EVENT_TYPES[index]}
    </span>
  );
}
