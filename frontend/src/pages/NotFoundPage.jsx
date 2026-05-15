import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
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
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 24px', borderRadius: 8,
        background: 'var(--blue)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600,
      }}>
        <Shield size={15} /> {user ? 'Go to Dashboard' : 'Back to Home'}
      </Link>
    </div>
  );
};

export default NotFoundPage;
