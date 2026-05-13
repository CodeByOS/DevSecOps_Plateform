import { useLocation } from 'react-router-dom';
import { Bell, Menu, Zap } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const pageTitles = {
  '/dashboard':   'Dashboard',
  '/projects':    'Projects',
  '/audit':       'Audit Log',
  '/ml':          'ML Service',
  '/settings':    'Settings',
};

const Header = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] ?? 'SecOps';

  return (
    <header style={{
      height: 64,
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Hamburger for mobile */}
        <button
          onClick={onMenuClick}
          className="show-on-mobile"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
            flexShrink: 0,
          }}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <h1 style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <Zap size={20} color="var(--blue)" />
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          padding: '6px',
          borderRadius: 8,
          transition: 'all 0.2s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-dim)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          title="Notifications"
        >
          <Bell size={18} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8,
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'linear-gradient(135deg, var(--blue), var(--purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="hide-on-mobile" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
