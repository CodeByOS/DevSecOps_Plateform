import { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, Zap, Clock, Info, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useAuditLogs from '../../hooks/useAuditLogs';
import { motion, AnimatePresence } from 'framer-motion';

const pageTitles = {
  '/dashboard':   'Dashboard',
  '/projects':    'Projects',
  '/audit':       'Audit Log',
  '/ml':          'ML Service',
  '/settings':    'Settings',
};

const Header = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  
  // Fetch recent audit logs for notifications
  const { logs, loading } = useAuditLogs({ limit: 5 });

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] ?? 'SecOps';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
      zIndex: 100,
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
        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }} ref={notificationRef}>
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            style={{
              background: showNotifications ? 'var(--blue-dim)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: showNotifications ? 'var(--blue)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              borderRadius: 8,
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
            onMouseEnter={e => { if (!showNotifications) { e.currentTarget.style.color = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-dim)'; } }}
            onMouseLeave={e => { if (!showNotifications) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; } }}
            title="Notifications"
          >
            <Bell size={18} />
            {logs.length > 0 && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                background: 'var(--red)',
                borderRadius: '50%',
                border: '2px solid var(--bg-card)',
              }} />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  width: 320,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  zIndex: 1000,
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Recent Activity</span>
                  <Link to="/audit" onClick={() => setShowNotifications(false)} style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>View All</Link>
                </div>
                
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
                  ) : logs.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No recent activity</div>
                  ) : (
                    logs.map((log) => (
                      <div key={log._id} style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid var(--border)',
                        cursor: 'default',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: 8, 
                            background: 'var(--bg-card)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: log.action.includes('BLOCKED') ? 'var(--red)' : 'var(--blue)'
                          }}>
                            {log.action.includes('BLOCKED') ? <Info size={16} /> : <Zap size={16} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                              {log.action.replace(/_/g, ' ')}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={10} />
                              {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu Dropdown */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button 
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px',
              background: showUserMenu ? 'var(--bg-elevated-hover)' : 'var(--bg-elevated)',
              border: '1px solid',
              borderColor: showUserMenu ? 'var(--blue)' : 'var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: 'inherit',
            }}
            onMouseEnter={e => { if (!showUserMenu) e.currentTarget.style.borderColor = 'var(--blue)'; }}
            onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
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
            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  width: 200,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  zIndex: 1000,
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{user?.role}</div>
                </div>

                <div style={{ padding: 6 }}>
                  <Link to="/settings" onClick={() => setShowUserMenu(false)} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    padding: '8px 10px', 
                    borderRadius: 8, 
                    color: 'var(--text-secondary)', 
                    textDecoration: 'none',
                    fontSize: 13,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <User size={16} /> My Profile
                  </Link>
                  <Link to="/settings" onClick={() => setShowUserMenu(false)} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    padding: '8px 10px', 
                    borderRadius: 8, 
                    color: 'var(--text-secondary)', 
                    textDecoration: 'none',
                    fontSize: 13,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Settings size={16} /> Settings
                  </Link>
                  <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                  <button onClick={handleLogout} style={{ 
                    display: 'flex', 
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    alignItems: 'center', 
                    gap: 10, 
                    padding: '8px 10px', 
                    borderRadius: 8, 
                    color: 'var(--red)', 
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
