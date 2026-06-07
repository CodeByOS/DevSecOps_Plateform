const Skeleton = ({ width, height, borderRadius = 12, style }) => (
  <div
    style={{
      width: width ?? '100%',
      height: height ?? 20,
      borderRadius,
      background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.5s infinite',
      ...style
    }}
  />
);

export default Skeleton;
