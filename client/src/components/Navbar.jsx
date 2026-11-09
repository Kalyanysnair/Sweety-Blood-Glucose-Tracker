// client/src/components/Navbar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, Calendar, BarChart2, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <Activity size={20} />
          </div>
          <span>Sweety</span>
        </NavLink>

        <nav>
          <ul className="navbar-nav">
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                <Activity size={16} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/readings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Clock size={16} />
                <span>History</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports/daily" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Calendar size={16} />
                <span>Daily</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports/month-to-date" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BarChart2 size={16} />
                <span>Month-to-Date</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports/monthly" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BarChart2 size={16} />
                <span>Monthly</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="navbar-user">
          <div className="user-badge" title={user?.email}>
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <span>{user?.name || 'User'}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}

