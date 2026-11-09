// client/src/components/StatCard.jsx
import React from 'react';

export default function StatCard({ label, value, unit = 'mg/dl', icon, subtitle, color }) {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <div className="stat-value-group">
          <span className="stat-value" style={color ? { color } : undefined}>
            {value !== null && value !== undefined ? value : '—'}
          </span>
          {value !== null && value !== undefined && unit && (
            <span className="stat-unit">{unit}</span>
          )}
        </div>
        {subtitle && <span className="card-subtitle">{subtitle}</span>}
      </div>
      {icon && (
        <div className="stat-icon" style={color ? { backgroundColor: `${color}15`, color } : undefined}>
          {icon}
        </div>
      )}
    </div>
  );
}

