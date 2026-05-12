const MiniTrend = ({ data = [], width = 140, height = 40, color = 'var(--blue)' }) => {
  if (!data.length) {
    return <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No data</div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * (width - 4) + 2;
      const y = height - ((value - min) / range) * (height - 6) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
      <circle cx={2} cy={height - 2} r="1" fill={color} />
    </svg>
  );
};

export default MiniTrend;
