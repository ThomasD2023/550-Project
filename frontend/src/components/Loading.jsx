export function SkeletonCard({ count = 3 }) {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ padding: '20px' }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        </div>
      ))}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--wine)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({ icon = '🔍', title = 'No results found', message = 'Try adjusting your filters.' }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
