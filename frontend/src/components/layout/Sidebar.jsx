import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, ScrollText,
  LogOut, Brain, X, Settings
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useMediaQuery from '../../hooks/useMediaQuery';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',  icon: FolderKanban,    label: 'Projects'  },
  { to: '/audit',     icon: ScrollText,      label: 'Audit Log' },
  { to: '/ml',        icon: Brain,           label: 'ML Service' },
  { to: '/settings',  icon: Settings,        label: 'Settings'   },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 40,
            }}
          />
        )}
      </AnimatePresence>
      
      <motion.aside 
        initial={false}
        animate={{ 
          x: (isMobile && !isOpen) ? -260 : 0,
          boxShadow: isOpen ? '20px 0 50px rgba(0,0,0,0.5)' : 'none'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          width: 260,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100vh',
          zIndex: 50,
          position: isMobile ? 'fixed' : 'relative',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              style={{
                width: 36, height: 36,
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}>
              <img src="/logo.svg" alt="Logo" style={{ width: 24, height: 24 }} />
            </motion.div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>SecOps</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform</div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="show-on-mobile"
            style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border)', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              width: 32, height: 32,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 12px' }}>
          {navItems.map(({ to, icon: Icon, label }, idx) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => { if(isMobile) onClose(); }}
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                marginBottom: 4,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                color: isActive ? 'var(--blue)' : 'var(--text-muted)',
                background: isActive ? 'var(--blue-dim)' : 'transparent',
                border: isActive ? '1px solid rgba(79, 163, 255, 0.2)' : '1px solid transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes('var(--blue-dim)')) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.background.includes('var(--blue-dim)')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: 16,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 12,
                background: 'linear-gradient(135deg, var(--blue), var(--blue-dim))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}>
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginTop: 2 }}>
                  {user?.role}
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02, background: 'var(--red-dim)', color: 'var(--red)', borderColor: 'rgba(241, 122, 95, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <LogOut size={16} />
              SIGN OUT
            </motion.button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
