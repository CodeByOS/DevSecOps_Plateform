const EmptyState = ({ title, description, action }) => (
  <div className="bg-bg-card/50 border-2 border-dashed border-border-main rounded-3xl p-12 text-center shadow-inner">
    <div className="text-xl font-black text-text-primary tracking-tight">{title}</div>
    <div className="text-sm text-text-muted mt-2 max-w-sm mx-auto font-medium leading-relaxed">{description}</div>
    {action && <div className="mt-8">{action}</div>}
  </div>
);

export default EmptyState;
