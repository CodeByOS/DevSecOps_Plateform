import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, ScrollText,
  Shield, LogOut, Brain, X, Settings, ChevronRight
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
        {isOpen && isMobile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
      
      <motion.aside 
        initial={false}
        animate={{ 
          x: (isMobile && !isOpen) ? -280 : 0,
          boxShadow: (isMobile && isOpen) ? '20px 0 50px rgba(0,0,0,0.5)' : 'none'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`w-[280px] bg-bg-card border-r border-border-main flex flex-col shrink-0 h-screen z-50 ${isMobile ? 'fixed' : 'relative'}`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-border-main flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-purple rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20"
            >
              <Shield size={20} className="text-white" strokeWidth={2.5} />
            </motion.div>
            <div>
              <div className="text-lg font-extrabold text-text-primary tracking-tight leading-none">SecOps</div>
              <div className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-[0.1em]">Intelligence Platform</div>
            </div>
          </div>
          
          {isMobile && (
            <button 
              onClick={onClose}
              className="bg-bg-elevated border border-border-main text-text-muted p-1.5 rounded-lg hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => { if(isMobile) onClose(); }}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20' 
                  : 'text-text-muted hover:bg-bg-hover hover:text-text-secondary border border-transparent'}
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-brand-blue' : 'group-hover:text-text-secondary'} />
                  <span className="font-semibold text-sm flex-1">{label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute left-0 w-1 h-6 bg-brand-blue rounded-r-full"
                    />
                  )}
                  <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-brand-blue/50' : 'text-text-muted/50'}`} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User & Footer Section */}
        <div className="p-4 border-t border-border-main bg-black/5">
          <div className="bg-bg-elevated/50 border border-border-main rounded-2xl p-4 space-y-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue/80 to-brand-blue-dim flex items-center justify-center text-white font-black text-sm shadow-inner">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-text-primary truncate">
                  {user?.name}
                </div>
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">
                  {user?.role}
                </div>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border-main bg-transparent text-text-muted text-[11px] font-extrabold uppercase tracking-widest hover:bg-brand-red/10 hover:text-brand-red hover:border-brand-red/30 transition-all duration-200"
            >
              <LogOut size={14} />
              Sign Out
            </motion.button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
