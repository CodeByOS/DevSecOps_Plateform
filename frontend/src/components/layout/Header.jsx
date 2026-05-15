import { useLocation } from 'react-router-dom';
import { Bell, Menu, Zap, Search, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuth from '../../hooks/useAuth';

const pageTitles = {
  '/dashboard':   'Command Center',
  '/projects':    'Repositories',
  '/audit':       'Security Ledger',
  '/ml':          'AI Intelligence',
  '/settings':    'System Config',
};

const Header = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] ?? 'SecOps Platform';

  return (
    <header className="h-16 bg-bg-card border-b border-border-main flex items-center justify-between px-6 shrink-0 z-30">
      <div className="flex items-center gap-6">
        <button
          onClick={onMenuClick}
          className="md:hidden bg-bg-elevated border border-border-main text-text-muted p-2 rounded-xl hover:text-text-primary transition-colors shadow-lg shadow-black/10"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-brand-blue/10 rounded-lg hidden sm:block">
            <Zap size={16} className="text-brand-blue" fill="currentColor" />
          </div>
          <h1 className="text-sm font-black text-text-primary uppercase tracking-[0.15em] border-l border-border-main pl-4 hidden sm:block">
            {title}
          </h1>
        </div>
      </div>

      {/* Global Search Bar (Visual only for now) */}
      <div className="hidden lg:flex flex-1 max-w-md mx-8">
        <div className="w-full relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Quick search telemetry..." 
            className="w-full bg-bg-elevated border border-border-main rounded-xl pl-11 pr-12 py-2 text-xs font-bold text-text-primary outline-none focus:border-brand-blue/30 focus:bg-bg-hover transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-bg-card rounded border border-border-main text-[9px] font-black text-text-muted">
            <Command size={10} /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2.5 bg-bg-elevated border border-border-main rounded-xl text-text-muted hover:text-brand-blue hover:border-brand-blue/30 transition-all group shadow-lg shadow-black/5">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-red rounded-full border-2 border-bg-elevated group-hover:scale-125 transition-transform" />
        </button>

        <div className="h-10 w-px bg-border-main mx-1 hidden sm:block" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-text-primary leading-none mb-1">{user?.name}</p>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter uppercase">{user?.role} ACCESS</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-black text-sm shadow-lg shadow-brand-blue/20 cursor-pointer"
          >
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
