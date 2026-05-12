import { useState } from 'react';
import Card from '../components/ui/Card';
import useAuditLogs from '../hooks/useAuditLogs';

const tableCell = {
  padding: '10px 8px',
  borderBottom: '1px solid var(--border-subtle)',
  fontSize: 12,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Audit Log</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Immutable record of platform actions
            {typeof total === 'number' && (
              <span style={{ marginLeft: 8, color: 'var(--blue)', fontWeight: 600 }}>
                ({total.toLocaleString()} total events)
              </span>
            )}
          </div>
        </div>
        <button
          onClick={exportToCSV}
          disabled={!logs.length}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13,
            cursor: logs.length ? 'pointer' : 'not-allowed', opacity: logs.length ? 1 : 0.5
          }}
        >
          Export CSV (Current Page)
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter by action (e.g. PROJECT_CREATED)"
          style={{
            flex: 1, minWidth: 200, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>From:</span>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>To:</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }} />
        </div>
        <button
          type="button"
          onClick={handleApply}
          style={{
            padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Apply
        </button>
        {(appliedFilters.action || appliedFilters.from || appliedFilters.to) && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '10px 14px', borderRadius: 10 }}>
          {error}
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 16, color: 'var(--text-muted)' }}>Loading audit logs…</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit events found.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-elevated)', textAlign: 'left' }}>
              <tr>
                <th style={tableCell}>Time</th>
                <th style={tableCell}>Action</th>
                <th style={tableCell}>User</th>
                <th style={tableCell}>Project</th>
                <th style={tableCell}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} style={{ transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tableCell, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ ...tableCell, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--blue)' }}>
                    {log.action}
                  </td>
                  <td style={tableCell}>{log.user?.name ?? 'System'}</td>
                  <td style={tableCell}>{log.project?.name ?? '—'}</td>
                  <td style={{ ...tableCell, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                    {log.ipAddress ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {(pages ?? 1) > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <div>
            Page {page} of {pages ?? 1} • {limit} per page
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-card)',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(pages ?? 1, p + 1))}
              disabled={page >= (pages ?? 1)}
              style={{
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-card)',
                color: page >= (pages ?? 1) ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: page >= (pages ?? 1) ? 'not-allowed' : 'pointer',
                opacity: page >= (pages ?? 1) ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
