// client/src/components/EmptyState.jsx
import React from 'react';
import { Activity } from 'lucide-react';

export default function EmptyState({
  title = 'No glucose readings found',
  description = 'You have not recorded any blood glucose readings for this period.',
  actionLabel,
  onAction,
  icon
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || <Activity size={28} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

