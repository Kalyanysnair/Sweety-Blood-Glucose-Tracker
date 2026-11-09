// client/src/pages/MonthToDateReportPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
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

export default function MonthToDateReportPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const todayStr = getTodayString();

  const fetchReport = async (date) => {
    setLoading(true);
    setError('');
    try {
      const data = await reportsApi.getMonthToDateReport(date);
      setReport(data);
    } catch (err) {
      setError('Failed to fetch Month-to-Date report.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Month-to-Date Glucose Report</h1>
          <p className="page-subtitle">
            Cumulative statistics from{' '}
            <strong>{report?.startDate || 'the 1st'}</strong> through{' '}
            <strong>{report?.endDate || selectedDate}</strong>.
          </p>
        </div>
        <div className="page-actions">
          <div className="filter-group" style={{ background: '#ffffff', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <Calendar size={16} color="#0d9488" />
            <span className="filter-label">Selected Date:</span>
            <input
              type="date"
              max={todayStr}
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

      {/* Summary Cards */}
      <div className="stats-grid">
        <StatCard
          label="MTD Average"
          value={report?.average}
          unit="mg/dl"
          icon={<Activity size={22} />}
          subtitle="Rounded to 1 decimal place"
        />
        <StatCard
          label="Highest MTD"
          value={report?.highest}
          unit="mg/dl"
          icon={<TrendingUp size={22} />}
          color="#991b1b"
          subtitle="Peak measurement"
        />
        <StatCard
          label="Lowest MTD"
          value={report?.lowest}
          unit="mg/dl"
          icon={<TrendingDown size={22} />}
          color="#0284c7"
          subtitle="Lowest measurement"
        />
        <StatCard
          label="Total MTD Readings"
          value={report?.count ?? 0}
          unit="readings"
          icon={<Clock size={22} />}
          color="#0d9488"
          subtitle={`Across ${report?.dailyBreakdown?.length || 0} active days`}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <span>Calculating month-to-date figures...</span>
        </div>
      ) : report?.empty ? (
        <EmptyState
          title={`No readings recorded for ${report?.startDate} through ${report?.endDate}`}
          description="You do not have any logged blood glucose entries for this month-to-date interval."
          actionLabel="Go to Dashboard to Add Reading"
          onAction={() => window.location.href = '/'}
        />
      ) : (
        <>
          {/* Trend Chart */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <div>
                <h2 className="card-title">Daily Average Glucose Trend</h2>
                <p className="card-subtitle">Mean blood glucose level per day over the month-to-date span.</p>
              </div>
            </div>

            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.dailyBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis domain={[40, 'auto']} stroke="#64748b" unit=" mg" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val) => [`${val} mg/dl`, 'Average']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <ReferenceLine y={140} stroke="#d97706" strokeDasharray="4 4" label={{ value: 'Target 140', fill: '#d97706', fontSize: 11 }} />
                  <ReferenceLine y={70} stroke="#0284c7" strokeDasharray="4 4" label={{ value: 'Low 70', fill: '#0284c7', fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ fill: '#0d9488', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Breakdown Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Daily Summary Breakdown</h2>
                <p className="card-subtitle">Daily aggregated numbers from the beginning of the month.</p>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Readings Logged</th>
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

