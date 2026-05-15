import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ScrollText, Download, Filter, Search, 
  Calendar, Shield, User, Globe, ChevronLeft, 
  ChevronRight, Activity, Terminal, AlertCircle
} from 'lucide-react';
import Card from '../components/ui/Card';
import useAuditLogs from '../hooks/useAuditLogs';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const AuditLogPage = () => {
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ action: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const limit = 20;

  const { logs, loading, error, total, pages } = useAuditLogs({
    page,
    limit,
    action: appliedFilters.action || undefined,
    from: appliedFilters.from || undefined,
    to: appliedFilters.to || undefined,
  });

  const handleApply = () => {
    setPage(1);
    setAppliedFilters({ action: actionFilter.trim(), from: fromDate, to: toDate });
  };

  const handleClear = () => {
    setActionFilter('');
    setFromDate('');
    setToDate('');
    setAppliedFilters({ action: '', from: '', to: '' });
    setPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleApply();
  };

  const exportToCSV = () => {
    if (!logs.length) return;
    const headers = ['Timestamp', 'Security Action', 'Initiator', 'Context Project', 'Source IP'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.user?.name ?? 'SYSTEM',
      log.project?.name ?? 'PLATFORM',
      log.ipAddress ?? 'INTERNAL'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `secops_audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-purple font-bold text-xs uppercase tracking-widest">
            <ScrollText size={14} />
            Compliance & Governance
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Security Ledger</h1>
          <p className="text-text-muted text-sm max-w-lg font-medium">
            Verifiable audit trail of all administrative and security actions performed within the platform ecosystem.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Integrity Events</p>
            <p className="text-xl font-black text-brand-blue">{total?.toLocaleString() ?? '—'}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportToCSV}
            disabled={!logs.length}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-main bg-bg-elevated/50 text-text-primary text-sm font-bold hover:bg-bg-elevated transition-all shadow-lg shadow-black/20 disabled:opacity-30"
          >
            <Download size={18} />
            Export Ledger
          </motion.button>
        </div>
      </header>

      {/* Filter Bar */}
      <Card className="p-4 bg-bg-card/50 border-border-main/50">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative group flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-blue transition-colors" />
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by action (e.g. PIPELINE_OVERRIDE)"
              className="w-full bg-bg-card border border-border-main rounded-xl pl-12 pr-4 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-brand-blue/50 transition-all"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-3 bg-bg-card border border-border-main px-4 py-2 rounded-xl w-full sm:w-auto">
              <Calendar size={16} className="text-text-muted" />
              <div className="flex items-center gap-2">
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent border-none text-[11px] font-black text-text-primary outline-none uppercase tracking-tighter" />
                <span className="text-[10px] text-text-muted font-black opacity-30">→</span>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent border-none text-[11px] font-black text-text-primary outline-none uppercase tracking-tighter" />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleApply}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-black shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/30 transition-all"
              >
                APPLY
              </button>
              {(appliedFilters.action || appliedFilters.from || appliedFilters.to) && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2.5 bg-bg-elevated border border-border-main text-text-muted rounded-xl text-xs font-black hover:text-text-primary transition-all"
                >
                  RESET
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Audit Table */}
      <Card className="p-0 overflow-visible border-border-main/30 shadow-2xl">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-elevated/50 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-main">
                <th className="px-6 py-5">Event Timestamp</th>
                <th className="px-6 py-5">Platform Action</th>
                <th className="px-6 py-5">Initiator</th>
                <th className="px-6 py-5">Context</th>
                <th className="px-6 py-5">Source Vector</th>
              </tr>
            </thead>
            <motion.tbody 
              variants={container}
              initial="hidden"
              animate="show"
              className="divide-y divide-border-main/50"
            >
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] animate-pulse">Decrypting logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Shield size={48} />
                      <p className="text-sm font-bold text-text-muted">No security events recorded in this scope.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <motion.tr 
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                    key={log._id} 
                    className="group hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-text-primary">{new Date(log.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-text-muted font-medium">{new Date(log.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                        <span className="text-[11px] font-black font-mono text-brand-blue tracking-tight">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-bg-elevated border border-border-main flex items-center justify-center text-text-muted">
                          <User size={12} />
                        </div>
                        <span className="text-xs font-bold text-text-secondary">{log.user?.name ?? 'SYSTEM'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {log.project ? (
                        <div className="flex items-center gap-2">
                          <Shield size={12} className="text-text-muted" />
                          <span className="text-xs font-bold text-text-secondary">{log.project.name}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-text-muted/50 uppercase">Global</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Terminal size={12} className="text-text-muted" />
                        <span className="text-[11px] font-mono text-text-muted font-bold tracking-tighter">
                          {log.ipAddress ?? 'INTERNAL'}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
          Ledger Entry <span className="text-text-primary">{(page - 1) * limit + 1}</span> - <span className="text-text-primary">{Math.min(page * limit, total ?? 0)}</span> OF <span className="text-text-primary">{total ?? 0}</span>
        </p>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border-main text-[10px] font-black text-text-muted hover:text-text-primary hover:border-brand-blue transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} /> PREV
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pages ?? 1) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === p ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-text-muted hover:bg-bg-elevated'}`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(pages ?? 1, p + 1))}
            disabled={page >= (pages ?? 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border-main text-[10px] font-black text-text-muted hover:text-text-primary hover:border-brand-blue transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            NEXT <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
