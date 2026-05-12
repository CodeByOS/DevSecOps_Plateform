const ScoreGauge = ({ score = 0, size = 140 }) => {
  const radius = 56;
  const center = 70;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const offset = circumference - (clamped / 100) * circumference;

  const color = clamped >= 80 ? 'var(--red)' : clamped >= 50 ? 'var(--orange)' : 'var(--green)';

  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 140 90">
      <path
        d="M14 70 A56 56 0 0 1 126 70"
        stroke="var(--border)"
        strokeWidth="10"
        fill="none"
      />
      <path
        d="M14 70 A56 56 0 0 1 126 70"
        stroke={color}
        strokeWidth="10"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
      <text x="70" y="68" textAnchor="middle" fill="var(--text-primary)" style={{ fontSize: 18, fontWeight: 700 }}>
        {clamped}
      </text>
      <text x="70" y="84" textAnchor="middle" fill="var(--text-muted)" style={{ fontSize: 10 }}>
        Risk score
      </text>
    </svg>
  );
};

export default ScoreGauge;
