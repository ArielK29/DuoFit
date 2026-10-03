// @ts-nocheck - web-only stand-in, see metro.config.js
import React from 'react';

export default function DateTimePicker({ value, mode = 'date', onChange }) {
  const iso = value.toISOString();
  return React.createElement('input', {
    type: mode === 'time' ? 'time' : 'date',
    defaultValue: mode === 'time' ? iso.slice(11, 16) : iso.slice(0, 10),
    onChange: (event) => {
      const next = new Date(value);
      if (mode === 'time') {
        const [h, m] = event.target.value.split(':').map(Number);
        next.setHours(h, m, 0, 0);
      } else {
        const [y, mo, d] = event.target.value.split('-').map(Number);
        next.setFullYear(y, mo - 1, d);
      }
      onChange?.({ type: 'set' }, next);
    },
    style: { height: 48, margin: 8 },
  });
}
