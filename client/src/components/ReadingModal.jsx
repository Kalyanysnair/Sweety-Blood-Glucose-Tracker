// client/src/components/ReadingModal.jsx
import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { readingsApi } from '../api/readingsApi';

const TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReadingModal({ isOpen, onClose, readingToEdit, onSaved }) {
  const [readingDate, setReadingDate] = useState(getTodayString());
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [glucoseValue, setGlucoseValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const todayStr = getTodayString();

  useEffect(() => {
    if (readingToEdit) {
      setReadingDate(readingToEdit.reading_date || todayStr);
      setTimeSlot(readingToEdit.time_slot || TIME_SLOTS[0]);
      setGlucoseValue(readingToEdit.glucose_value !== undefined ? String(readingToEdit.glucose_value) : '');
    } else {
      setReadingDate(todayStr);
      setTimeSlot(TIME_SLOTS[0]);
      setGlucoseValue('');
    }
    setError('');
  }, [readingToEdit, isOpen, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!readingDate) {
      setError('Reading date is required.');
      return;
    }

    if (readingDate > todayStr) {
      setError('Reading date cannot be in the future.');
      return;
    }

    if (!timeSlot) {
      setError('Please select a time slot.');
      return;
    }

    const parsedValue = Number(glucoseValue);
    if (!glucoseValue || isNaN(parsedValue) || !Number.isInteger(parsedValue)) {
      setError('Glucose value must be a whole integer number.');
      return;
    }

    if (parsedValue < 40 || parsedValue > 600) {
      setError('Glucose value must be between 40 and 600 mg/dl.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        reading_date: readingDate,
        time_slot: timeSlot,
        glucose_value: parsedValue
      };

      if (readingToEdit && readingToEdit.id) {
        await readingsApi.updateReading(readingToEdit.id, payload);
      } else {
        await readingsApi.createReading(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save glucose reading. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {readingToEdit ? 'Edit Glucose Reading' : 'Add Glucose Reading'}
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="readingDate">
                Date
              </label>
              <input
                id="readingDate"
                type="date"
                max={todayStr}
                className="form-input"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                required
              />
              <span className="form-help">Date cannot be in the future.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="timeSlot">
                Time Slot
              </label>
              <select
                id="timeSlot"
                className="form-select"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                required
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <span className="form-help">Only one reading allowed per slot per date.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="glucoseValue">
                Glucose Level (mg/dl)
              </label>
              <input
                id="glucoseValue"
                type="number"
                min="40"
                max="600"
                step="1"
                placeholder="e.g. 110"
                className="form-input"
                value={glucoseValue}
                onChange={(e) => setGlucoseValue(e.target.value)}
                required
              />
              <span className="form-help">Must be a whole number between 40 and 600.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : readingToEdit ? 'Save Changes' : 'Add Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

