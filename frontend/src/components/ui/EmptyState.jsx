const EmptyState = ({ title, description, action }) => (
  <div
    style={{
      background: 'var(--bg-card)',
      border: '1px dashed var(--border)',
      borderRadius: 12,
      padding: 40,
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>{description}</div>
    {action && <div style={{ marginTop: 20 }}>{action}</div>}
  </div>
);

export default EmptyState;
