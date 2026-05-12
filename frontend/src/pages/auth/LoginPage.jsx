import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, Zap } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const field = (label, id, type, placeholder, value, onChange, show, onToggle) => (
  <div>
    <label htmlFor={id} style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        id={id} 
        type={type} 
        placeholder={placeholder} 
        value={value} 
        onChange={onChange} 
        required
        style={{
          width: '100%', 
          padding: '11px 40px 11px 14px', 
          borderRadius: 10,
          border: '1px solid var(--border)', 
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)', 
          fontSize: 14, 
          outline: 'none', 
          boxSizing: 'border-box',
          transition: 'all 0.2s ease',
          fontFamily: 'inherit',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--blue)';
          e.target.style.boxShadow = '0 0 0 3px rgba(79, 163, 255, 0.1)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
      />
      {onToggle && (
        <button 
          type="button" 
          onClick={onToggle} 
          style={{
            position: 'absolute', 
            right: 14, 
            top: '50%', 
            transform: 'translateY(-50%)',
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: 'var(--text-muted)', 
            padding: 4,
            transition: 'color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg-base)', 
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow - larger, more subtle */}
      <div style={{
        position: 'fixed', 
        top: '-20%', 
        right: '-10%', 
        width: 600, 
        height: 600, 
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79, 163, 255, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', 
        bottom: '-10%', 
        left: '-5%', 
        width: 500, 
        height: 500, 
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(197, 163, 255, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', 
        maxWidth: 420,
        background: 'var(--bg-card)', 
        border: '1px solid var(--border)',
        borderRadius: 16, 
        padding: 40,
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, 
              height: 56, 
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--blue), var(--purple))',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(79, 163, 255, 0.2)',
            }}>
              <Shield size={28} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <Zap size={20} color="var(--blue)" />
                SecOps Platform
              </div>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
                Enterprise security at scale
              </p>
            </div>
          </Link>
        </div>

        {error && (
          <div style={{
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: 10, 
            padding: '12px 14px',
            borderRadius: 10, 
            background: 'var(--red-dim)', 
            border: '1px solid var(--red)',
            color: 'var(--red)', 
            fontSize: 13, 
            marginBottom: 24,
          }}>
            <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {field('Email Address', 'email', 'email', 'you@example.com', email, e => setEmail(e.target.value))}
          {field('Password', 'password', showPw ? 'text' : 'password', '••••••••', password, e => setPassword(e.target.value), showPw, () => setShowPw(p => !p))}

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              padding: '12px', 
              borderRadius: 10, 
              border: 'none',
              background: loading ? 'var(--border)' : 'var(--blue)',
              color: '#fff',
              fontSize: 14, 
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(79, 163, 255, 0.3)',
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--blue-light)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 163, 255, 0.4)';
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--blue)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 163, 255, 0.3)';
              }
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
