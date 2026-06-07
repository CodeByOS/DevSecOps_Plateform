import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollText, Filter, Download, X, Calendar, User, Terminal, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import useAuditLogs from '../hooks/useAuditLogs';

const tableCell = {
  padding: '16px 16px',
  borderBottom: '1px solid var(--border-subtle)',
  fontSize: 13,
};

/** Container animation for staggered table rows */
const tableContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

/** Individual table row animation */
const tableRow = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }
};

const AuditLogPage = () => {
  const shouldReduce = useReducedMotion();
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
    setPage(1); // reset to first page on new filter
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
    const headers = ['Time', 'Action', 'User', 'Project', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.user?.name ?? 'System',
      log.project?.name ?? '—',
      log.ipAddress ?? '—'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 14, 
            background: 'var(--purple-dim)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(197, 163, 255, 0.2)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            <ScrollText size={24} color="var(--purple)" strokeWidth={2} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Audit Log</h2>
            <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
              Immutable record of platform actions
              {typeof total === 'number' && (
                <span style={{ marginLeft: 8, color: 'var(--blue)', fontWeight: 600 }}>
                  ({total.toLocaleString()} events)
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          disabled={!logs.length}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
            cursor: logs.length ? 'pointer' : 'not-allowed',
            opacity: logs.length ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { if(logs.length) e.currentTarget.style.borderColor = 'var(--blue)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-card)', padding: 16, borderRadius: 16, border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by action (e.g. PROJECT_CREATED)"
            style={{
              width: '100%', padding: '11px 12px 11px 40px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)', padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
          <Calendar size={16} color="var(--text-muted)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>FROM</span>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 13, fontWeight: 500 }} />
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>TO</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 13, fontWeight: 500 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleApply}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, border: 'none',
              background: 'var(--blue)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 163, 255, 0.2)'
            }}
          >
            <Filter size={16} />
            Apply
          </button>
          {(appliedFilters.action || appliedFilters.from || appliedFilters.to) && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500 }}>
          {error}
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="status-pulse" style={{ margin: '0 auto 16px' }}></div>
            Loading audit logs…
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 80, textAlign: 'center' }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: 20, background: 'var(--bg-elevated)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              border: '1px solid var(--border)', opacity: 0.5
            }}>
              <ScrollText size={32} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>No audit events found</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Try adjusting your filters to find what you're looking for.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-elevated)', textAlign: 'left' }}>
              <tr>
                <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</th>
                <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project</th>
                <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>IP Address</th>
              </tr>
            </thead>
            <motion.tbody
              variants={tableContainer}
              initial="hidden"
              animate="show"
              key={logs.length}
            >
              {logs.map((log) => (
                <motion.tr
                  key={log._id}
                  variants={tableRow}
                  style={{ transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tableCell, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    <div style={{ fontSize: 13 }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td style={tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Terminal size={14} color="var(--blue)" />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--blue)', fontWeight: 600, letterSpacing: '-0.2px' }}>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td style={tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {log.user?.name?.[0]?.toUpperCase() ?? 'S'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.user?.name ?? 'System'}</span>
                    </div>
                  </td>
                  <td style={tableCell}>
                    {log.project?.name ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {log.project.name}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Global</span>
                    )}
                  </td>
                  <td style={{ ...tableCell, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {log.ipAddress ?? '—'}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {(pages ?? 1) > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            Showing page <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{page}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{pages ?? 1}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={page <= 1}
              style={{
                padding: '8px 16px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if(page > 1) e.currentTarget.style.borderColor = 'var(--blue)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => { setPage(p => Math.min(pages ?? 1, p + 1)); window.scrollTo(0, 0); }}
              disabled={page >= (pages ?? 1)}
              style={{
                padding: '8px 16px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                color: page >= (pages ?? 1) ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page >= (pages ?? 1) ? 'not-allowed' : 'pointer',
                opacity: page >= (pages ?? 1) ? 0.5 : 1,
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if(page < (pages ?? 1)) e.currentTarget.style.borderColor = 'var(--blue)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
