// client/src/components/GlucoseBadge.jsx
import React from 'react';

/**
 * Categorizes and displays blood glucose levels based on reading value and time slot.
 * Clinical standards:
 * - Fasting: Normal (70-99 mg/dl), Elevated (100-125 mg/dl), High (>=126 mg/dl), Low (<70 mg/dl)
 * - Post-meal: Normal (<140 mg/dl), Elevated (140-199 mg/dl), High (>=200 mg/dl), Low (<70 mg/dl)
 */
export default function GlucoseBadge({ value, slot }) {
  if (value === null || value === undefined) return null;

  const isFasting = slot && slot.toLowerCase().includes('fasting');
  let category = 'normal';
  let label = 'Normal';

  if (value < 70) {
    category = 'low';
    label = 'Low';
  } else if (isFasting) {
    if (value <= 99) {
      category = 'normal';
      label = 'Normal';
    } else if (value <= 125) {
      category = 'elevated';
      label = 'Elevated';
    } else {
      category = 'high';
      label = 'High';
    }
  } else {
    // Post-meal
    if (value < 140) {
      category = 'normal';
      label = 'Normal';
    } else if (value <= 199) {
      category = 'elevated';
      label = 'Elevated';
    } else {
      category = 'high';
      label = 'High';
    }
  }

  return (
    <span className={`badge badge-${category}`} title={`${label} Range (${value} mg/dl)`}>
      <span style={{ fontSize: '10px' }}>●</span> {label}
    </span>
  );
}

