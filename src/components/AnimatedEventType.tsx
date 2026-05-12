'use client';

import { useState, useEffect } from 'react';

const EVENT_TYPES = [
  'coffee catchup',
  'birthday party',
  'weekly meetup',
  'happy hour',
  'soccer practice',
  'family vacay',
  'dinner plans',
  'book club',
  'game night',
  'team offsite',
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
