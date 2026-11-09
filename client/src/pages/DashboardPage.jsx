// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  BarChart2,
  CheckCircle2,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../api/reportsApi';
import { readingsApi } from '../api/readingsApi';
import StatCard from '../components/StatCard';
import GlucoseBadge from '../components/GlucoseBadge';
import EmptyState from '../components/EmptyState';
import ReadingModal from '../components/ReadingModal';

const ALL_TIME_SLOTS = [
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [dailyReport, setDailyReport] = useState(null);
  const [recentReadings, setRecentReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [readingToEdit, setReadingToEdit] = useState(null);

  const todayStr = getTodayString();
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dailyRes, recentRes] = await Promise.all([
        reportsApi.getDailyReport(todayStr),
        readingsApi.getReadings({ limit: 10, sort: 'DESC' })
      ]);
      setDailyReport(dailyRes);
      setRecentReadings(recentRes.readings || []);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete reading.');
      }
    }
  };

  // Map today's recorded slots
  const todayReadingsMap = {};
  if (dailyReport?.readings) {
    dailyReport.readings.forEach((r) => {
      todayReadingsMap[r.time_slot] = r;
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.name || 'User'}</h1>
          <p className="page-subtitle">Here is your blood glucose overview for today, {formattedToday}.</p>
        </div>
        <div className="page-actions">
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

      {/* Summary Cards */}
      <div className="stats-grid">
        <StatCard
          label="Today's Average"
          value={dailyReport?.average}
          unit="mg/dl"
          icon={<Activity size={22} />}
          subtitle={dailyReport?.empty ? 'No readings yet' : 'Calculated across today'}
        />
        <StatCard
          label="Highest Today"
          value={dailyReport?.highest}
          unit="mg/dl"
          icon={<TrendingUp size={22} />}
          color="#991b1b"
          subtitle={dailyReport?.empty ? 'No data' : 'Peak glucose level'}
        />
        <StatCard
          label="Lowest Today"
          value={dailyReport?.lowest}
          unit="mg/dl"
          icon={<TrendingDown size={22} />}
          color="#0284c7"
          subtitle={dailyReport?.empty ? 'No data' : 'Lowest glucose level'}
        />
        <StatCard
          label="Readings Today"
          value={dailyReport?.count ?? 0}
          unit="/ 4 slots"
          icon={<Clock size={22} />}
          color="#0d9488"
          subtitle={`${4 - (dailyReport?.count || 0)} slots remaining`}
        />
      </div>

      {/* Today's 4 Slots Tracker */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Calendar size={20} color="#0d9488" />
              <span>Today's Time Slots Tracking</span>
            </h2>
            <p className="card-subtitle">
              Monitor daily intervals: Maximum 4 readings allowed per calendar day.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {ALL_TIME_SLOTS.map((slot) => {
            const recorded = todayReadingsMap[slot];
            return (
              <div
                key={slot}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: recorded ? '1px solid #99f6e4' : '1px dashed #cbd5e1',
                  background: recorded ? '#f0fdfa' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '110px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      {slot}
                    </span>
                    {recorded ? (
                      <CheckCircle2 size={18} color="#0d9488" />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pending</span>
                    )}
                  </div>
                  {recorded ? (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
                        {recorded.glucose_value}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>mg/dl</span>
                      <GlucoseBadge value={recorded.glucose_value} slot={slot} />
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px' }}>
                      Not recorded yet.
                    </p>
                  )}
                </div>

                <div style={{ marginTop: '10px', textAlign: 'right' }}>
                  {recorded ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(recorded)}
                      style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setReadingToEdit({
                          reading_date: todayStr,
                          time_slot: slot,
                          glucose_value: ''
                        });
                        setIsModalOpen(true);
                      }}
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      + Record Slot
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Readings Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Clock size={20} color="#0d9488" />
              <span>Recent Glucose Readings</span>
            </h2>
            <p className="card-subtitle">Your latest logged blood sugar measurements.</p>
          </div>
          <Link to="/readings" className="btn btn-secondary btn-sm">
            View All History →
          </Link>
        </div>

        {recentReadings.length === 0 ? (
          <EmptyState
            title="No readings logged yet"
            description="Start tracking your health journey by logging your first blood glucose reading."
            actionLabel="Add First Reading"
            onAction={handleOpenAdd}
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
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReadings.slice(0, 7).map((reading) => (
                  <tr key={reading.id}>
                    <td>
                      <strong>{reading.reading_date}</strong>
                    </td>
                    <td>{reading.time_slot}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                        {reading.glucose_value}
                      </span>{' '}
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>mg/dl</span>
                    </td>
                    <td>
                      <GlucoseBadge value={reading.glucose_value} slot={reading.time_slot} />
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
        onSaved={fetchData}
      />
    </div>
  );
}

