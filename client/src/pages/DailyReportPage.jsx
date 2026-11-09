// client/src/pages/DailyReportPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  PlusCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { reportsApi } from '../api/reportsApi';
import StatCard from '../components/StatCard';
import GlucoseBadge from '../components/GlucoseBadge';
import EmptyState from '../components/EmptyState';
import ReadingModal from '../components/ReadingModal';

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayStr = getTodayString();

  const fetchReport = async (date) => {
    setLoading(true);
    setError('');
    try {
      const data = await reportsApi.getDailyReport(date);
      setReport(data);
    } catch (err) {
      setError('Failed to fetch daily report.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const chartData = report?.readings
    ? report.readings.map((r) => ({
        name: r.time_slot.replace('Morning (fasting)', 'Fasting').replace('After ', ''),
        slot: r.time_slot,
        glucose: r.glucose_value
      }))
    : [];

  const getBarColor = (value) => {
    if (value < 70) return '#0284c7'; // low
    if (value <= 140) return '#0d9488'; // normal
    if (value <= 199) return '#d97706'; // elevated
    return '#dc2626'; // high
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Glucose Report</h1>
          <p className="page-subtitle">Analyze your blood sugar readings and fluctuations for a specific date.</p>
        </div>
        <div className="page-actions">
          <div className="filter-group" style={{ background: '#ffffff', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <Calendar size={16} color="#0d9488" />
            <span className="filter-label">Select Date:</span>
            <input
              type="date"
              max={todayStr}
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.88rem' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
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
          label="Average Glucose"
          value={report?.average}
          unit="mg/dl"
          icon={<Activity size={22} />}
          subtitle="Rounded to 1 decimal place"
        />
        <StatCard
          label="Highest Reading"
          value={report?.highest}
          unit="mg/dl"
          icon={<TrendingUp size={22} />}
          color="#991b1b"
          subtitle="Daily maximum"
        />
        <StatCard
          label="Lowest Reading"
          value={report?.lowest}
          unit="mg/dl"
          icon={<TrendingDown size={22} />}
          color="#0284c7"
          subtitle="Daily minimum"
        />
        <StatCard
          label="Total Readings"
          value={report?.count ?? 0}
          unit="/ 4 slots"
          icon={<Clock size={22} />}
          color="#0d9488"
          subtitle={`For ${selectedDate}`}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <span>Generating daily report...</span>
        </div>
      ) : report?.empty ? (
        <EmptyState
          title={`No readings recorded on ${selectedDate}`}
          description="There are no blood glucose records logged for this selected date. Click below to add a reading."
          actionLabel="Add Reading for this Date"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <>
          {/* Daily Visualization Chart */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <div>
                <h2 className="card-title">Glucose Readings by Time Slot</h2>
                <p className="card-subtitle">Visual distribution of recorded readings for {selectedDate}.</p>
              </div>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 13 }} />
                  <YAxis domain={[40, 'auto']} stroke="#64748b" unit=" mg" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val, name, props) => [`${val} mg/dl`, props.payload.slot]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="glucose" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.glucose)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Individual Readings with Time Slots */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Individual Readings ({report.count})</h2>
                <p className="card-subtitle">Detailed breakdown of each measurement recorded on {selectedDate}.</p>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time Slot</th>
                    <th>Glucose Value</th>
                    <th>Classification</th>
                    <th>Recorded Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {report.readings.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.time_slot}</strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                          {r.glucose_value}
                        </span>{' '}
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>mg/dl</span>
                      </td>
                      <td>
                        <GlucoseBadge value={r.glucose_value} slot={r.time_slot} />
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleTimeString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        readingToEdit={{ reading_date: selectedDate }}
        onSaved={() => fetchReport(selectedDate)}
      />
    </div>
  );
}

