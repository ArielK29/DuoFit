// @ts-nocheck - web-only stand-in, see metro.config.js
import React from 'react';

export default function Slider({ value, minimumValue = 0, maximumValue = 1, step = 0, onValueChange, style }) {
  return React.createElement('input', {
    type: 'range',
    min: minimumValue,
    max: maximumValue,
    step: step || 'any',
    value,
    onChange: (event) => onValueChange?.(Number(event.target.value)),
    style: { width: '100%', height: 48, ...(style ? {} : {}) },
  });
}
