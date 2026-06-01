import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const NotFoundPage = () => {
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', textAlign: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 80, fontWeight: 800, color: 'var(--border)', lineHeight: 1, marginBottom: 24 }}>404</div>
      <h1 style={{ color: 'var(--text-primary)', margin: '0 0 12px', fontSize: 24 }}>Page not found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>The page you're looking for doesn't exist.</p>
      <Link to={user ? "/dashboard" : "/"} style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '12px 28px', borderRadius: 12,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        color: 'var(--text-primary)', textDecoration: 'none', fontSize: 14, fontWeight: 700,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <img src="/logo.svg" alt="Logo" style={{ width: 18, height: 18 }} /> {user ? 'Go to Dashboard' : 'Back to Home'}
      </Link>
    </div>
  );
};

export default NotFoundPage;
