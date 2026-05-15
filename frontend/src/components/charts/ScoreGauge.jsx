const ScoreGauge = ({ score = 0 }) => {
  const radius = 56;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const offset = circumference - (clamped / 100) * circumference;

  const color = clamped >= 80 ? '#f17a5f' : clamped >= 50 ? '#e8a844' : '#42c77f';

  return (
    <svg className="w-full h-full" viewBox="0 0 140 90">
      {/* Background Track */}
      <path
        d="M14 70 A56 56 0 0 1 126 70"
        stroke="#252f3d"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      {/* Active Track */}
      <path
        d="M14 70 A56 56 0 0 1 126 70"
        stroke={color}
        strokeWidth="10"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease' }}
      />
      {/* Inner Glow shadow (visual only) */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};

export default ScoreGauge;
