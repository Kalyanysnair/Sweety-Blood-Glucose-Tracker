// client/src/pages/ReadingsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Clock,
  PlusCircle,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  RotateCcw,
  Download
} from 'lucide-react';
import { readingsApi } from '../api/readingsApi';
import GlucoseBadge from '../components/GlucoseBadge';
import EmptyState from '../components/EmptyState';
import ReadingModal from '../components/ReadingModal';

const TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

export default function ReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSlot, setFilterSlot] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [readingToEdit, setReadingToEdit] = useState(null);

  const fetchReadings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterStartDate) params.start_date = filterStartDate;
      if (filterEndDate) params.end_date = filterEndDate;
      if (filterSlot) params.time_slot = filterSlot;
      if (sortOrder) params.sort = sortOrder;

      const res = await readingsApi.getReadings(params);
      setReadings(res.readings || []);
    } catch (err) {
      setError('Failed to fetch readings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [filterStartDate, filterEndDate, filterSlot, sortOrder]);

  const handleOpenAdd = () => {
    setReadingToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reading) => {
    setReadingToEdit(reading);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this glucose reading?')) {
      try {
        await readingsApi.deleteReading(id);
        fetchReadings();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete reading.');
      }
    }
  };

  const handleResetFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterSlot('');
    setSortOrder('DESC');
  };

  const handleExportCSV = () => {
    if (readings.length === 0) return;
    const headers = ['Date', 'Time Slot', 'Glucose Value (mg/dl)', 'Logged At'];
    const rows = readings.map((r) => [
      r.reading_date,
      `"${r.time_slot}"`,
      r.glucose_value,
      r.created_at ? new Date(r.created_at).toLocaleString() : ''
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sweety_readings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = Boolean(filterStartDate || filterEndDate || filterSlot || sortOrder !== 'DESC');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reading History</h1>
          <p className="page-subtitle">View, search, edit, and export all your logged blood glucose entries.</p>
        </div>
        <div className="page-actions">
          {readings.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportCSV}
              title="Download CSV for doctor consultations"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
            <PlusCircle size={18} />
            <span>Add Reading</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <Calendar size={16} color="#64748b" />
          <span className="filter-label">From:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">To:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} color="#64748b" />
          <span className="filter-label">Time Slot:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
            value={filterSlot}
            onChange={(e) => setFilterSlot(e.target.value)}
          >
            <option value="">All Time Slots</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Sort:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="DESC">Newest Date First</option>
            <option value="ASC">Oldest Date First</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetFilters}
            title="Reset Filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <span>Loading readings...</span>
          </div>
        ) : readings.length === 0 ? (
          <EmptyState
            title="No readings match your criteria"
            description={
              hasActiveFilters
                ? 'Try adjusting your filters or clearing them to view all recordings.'
                : 'No blood glucose readings have been recorded yet.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : 'Add First Reading'}
            onAction={hasActiveFilters ? handleResetFilters : handleOpenAdd}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Glucose Value</th>
                  <th>Classification</th>
                  <th>Logged At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading) => (
                  <tr key={reading.id}>
                    <td>
                      <strong>{reading.reading_date}</strong>
                    </td>
                    <td>{reading.time_slot}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                        {reading.glucose_value}
                      </span>{' '}
                      <span style={{ color: '#64748b', fontSize: '0.82rem' }}>mg/dl</span>
                    </td>
                    <td>
                      <GlucoseBadge value={reading.glucose_value} slot={reading.time_slot} />
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {reading.created_at ? new Date(reading.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(reading)}
                          title="Edit reading"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(reading.id)}
                          title="Delete reading"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        readingToEdit={readingToEdit}
        onSaved={fetchReadings}
      />
    </div>
  );
}
