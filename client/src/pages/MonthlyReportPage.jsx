// client/src/pages/MonthlyReportPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle
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
import EmptyState from '../components/EmptyState';

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MonthlyReportPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const todayStr = getTodayString();

  const fetchReport = async (date) => {
    setLoading(true);
    setError('');
    try {
      const data = await reportsApi.getMonthlyReport(date);
      setReport(data);
    } catch (err) {
      setError('Failed to fetch monthly report.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const targetMonth = report?.targetMonth;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Previous Month Glucose Report</h1>
          <p className="page-subtitle">
            Historical analysis for the entire previous calendar month:{' '}
            <strong>{targetMonth?.name || 'Previous Month'}</strong> (
            {targetMonth?.startDate} to {targetMonth?.endDate}).
          </p>
        </div>
        <div className="page-actions">
          <div className="filter-group" style={{ background: '#ffffff', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <Calendar size={16} color="#0d9488" />
            <span className="filter-label">Relative to Date:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.88rem' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Target Month Pill Header */}
      {targetMonth && (
        <div
          style={{
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <span style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: 600, textTransform: 'uppercase' }}>
              Target Calendar Month
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#134e4a' }}>
              {targetMonth.name}
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#0f766e' }}>
            Interval: <code>{targetMonth.startDate}</code> to <code>{targetMonth.endDate}</code>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="stats-grid">
        <StatCard
          label="Monthly Average"
          value={report?.average}
          unit="mg/dl"
          icon={<Activity size={22} />}
          subtitle="Rounded to 1 decimal place"
        />
        <StatCard
          label="Highest of Month"
          value={report?.highest}
          unit="mg/dl"
          icon={<TrendingUp size={22} />}
          color="#991b1b"
          subtitle="Monthly maximum"
        />
        <StatCard
          label="Lowest of Month"
          value={report?.lowest}
          unit="mg/dl"
          icon={<TrendingDown size={22} />}
          color="#0284c7"
          subtitle="Monthly minimum"
        />
        <StatCard
          label="Total Monthly Readings"
          value={report?.count ?? 0}
          unit="readings"
          icon={<Clock size={22} />}
          color="#0d9488"
          subtitle={`Across previous month`}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <span>Compiling previous month analysis...</span>
        </div>
      ) : report?.empty ? (
        <EmptyState
          title={`No readings recorded for ${targetMonth?.name || 'the previous month'}`}
          description="There were no blood glucose records logged during this previous calendar month period."
          actionLabel="View Dashboard"
          onAction={() => window.location.href = '/'}
        />
      ) : (
        <>
          {/* Monthly Trend Chart */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <div>
                <h2 className="card-title">Daily Average Readings Across {targetMonth?.name}</h2>
                <p className="card-subtitle">Overview of daily mean blood glucose throughout the month.</p>
              </div>
            </div>

            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.dailyBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis domain={[40, 'auto']} stroke="#64748b" unit=" mg" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val) => [`${val} mg/dl`, 'Average']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="average" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Day-by-Day Historical Breakdown</h2>
                <p className="card-subtitle">Aggregated values per day in {targetMonth?.name}.</p>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Readings</th>
                    <th>Daily Average</th>
                    <th>Lowest</th>
                    <th>Highest</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dailyBreakdown.map((row) => (
                    <tr key={row.date}>
                      <td>
                        <strong>{row.date}</strong>
                      </td>
                      <td>
                        <span className="badge badge-normal">{row.reading_count} readings</span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{row.average}</strong> mg/dl
                      </td>
                      <td style={{ color: '#0284c7' }}>{row.lowest} mg/dl</td>
                      <td style={{ color: '#991b1b' }}>{row.highest} mg/dl</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

