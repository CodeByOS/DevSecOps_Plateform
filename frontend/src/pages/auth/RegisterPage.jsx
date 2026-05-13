import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, Zap } from 'lucide-react';
import { register as apiRegister } from '../../api/auth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error,  setError]  = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await apiRegister(form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', 
    padding: '11px 14px', 
    borderRadius: 10,
    border: '1px solid var(--border)', 
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', 
    fontSize: 14, 
    outline: 'none', 
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
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
      <div style={{ 
        position: 'fixed', 
        top: '-20%', 
        right: '-10%', 
        width: 600, 
        height: 600, 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(79, 163, 255, 0.08) 0%, transparent 70%)', 
        pointerEvents: 'none' 
      }} />
      <div style={{ 
        position: 'fixed', 
        bottom: '-10%', 
        left: '-5%', 
        width: 500, 
        height: 500, 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(197, 163, 255, 0.06) 0%, transparent 70%)', 
        pointerEvents: 'none' 
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
                Create your account
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
            marginBottom: 24 
          }}>
            <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div>
            <label htmlFor="name" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
            <input 
              id="name" 
              type="text" 
              placeholder="Jane Smith" 
              value={form.name} 
              onChange={set('name')} 
              required 
              style={inputStyle}
              onFocus={e => {
                e.target.style.borderColor = 'var(--blue)';
                e.target.style.boxShadow = '0 0 0 3px rgba(79, 163, 255, 0.1)';
              }} 
              onBlur={e => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }} 
            />
          </div>
          {/* Email */}
          <div>
            <label htmlFor="reg-email" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
            <input 
              id="reg-email" 
              type="email" 
              placeholder="you@example.com" 
              value={form.email} 
              onChange={set('email')} 
              required 
              style={inputStyle}
              onFocus={e => {
                e.target.style.borderColor = 'var(--blue)';
                e.target.style.boxShadow = '0 0 0 3px rgba(79, 163, 255, 0.1)';
              }} 
              onBlur={e => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }} 
            />
          </div>
          {/* Password */}
          <div>
            <label htmlFor="reg-password" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                id="reg-password" 
                type={showPw ? 'text' : 'password'} 
                placeholder="Min. 6 characters" 
                value={form.password} 
                onChange={set('password')} 
                required 
                style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--blue)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79, 163, 255, 0.1)';
                }} 
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }} 
              />
              <button 
                type="button" 
                onClick={() => setShowPw(p => !p)} 
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
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              padding: '12px', 
              borderRadius: 10, 
              border: 'none', 
              marginTop: 8,
              background: loading ? 'var(--border)' : 'var(--blue)',
              color: '#fff',
              fontSize: 14, 
              fontWeight: 700, 
              cursor: loading ? 'not-allowed' : 'pointer',
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
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
