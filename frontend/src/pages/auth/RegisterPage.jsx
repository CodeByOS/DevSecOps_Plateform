import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, AlertCircle, User, Mail, Lock, ArrowRight, RefreshCw } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error,  setError]  = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { 
      setError('SECURITY POLICY: Password must be at least 6 characters.'); 
      return; 
    }
    setError(''); 
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message ?? 'REGISTRATION FAILURE: Access denied or system error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-bg-card border border-border-main rounded-3xl p-10 shadow-2xl relative z-10 overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-purple via-brand-blue to-brand-purple" />
        
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: -5, scale: 1.05 }}
            className="inline-flex w-16 h-16 bg-gradient-to-br from-brand-purple to-brand-blue rounded-2xl items-center justify-center shadow-xl shadow-brand-purple/20 mb-6"
          >
            <Shield size={32} className="text-white" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Access Provisioning</h1>
          <p className="text-text-muted text-xs font-bold uppercase tracking-[0.2em] mt-2">Create Security Operative Identity</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-4 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-xl text-[10px] font-black uppercase tracking-widest mb-8 shadow-lg shadow-brand-red/5"
          >
            <AlertCircle size={16} className="shrink-0" /> 
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Personnel Name</label>
            <div className="relative group">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors" />
              <input
                type="text" 
                placeholder="Jane operative" 
                value={form.name} 
                onChange={set('name')} 
                required
                className="w-full bg-bg-elevated border border-border-main rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-text-primary outline-none focus:border-brand-purple/50 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Identity Vector (Email)</label>
            <div className="relative group">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors" />
              <input
                type="email" 
                placeholder="jane@secops.io" 
                value={form.email} 
                onChange={set('email')} 
                required
                className="w-full bg-bg-elevated border border-border-main rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-text-primary outline-none focus:border-brand-purple/50 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Access Credential</label>
            <div className="relative group">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-purple transition-colors" />
              <input
                type={showPw ? 'text' : 'password'} 
                placeholder="••••••••••••" 
                value={form.password} 
                onChange={set('password')} 
                required
                className="w-full bg-bg-elevated border border-border-main rounded-xl pl-12 pr-12 py-3.5 text-sm font-bold text-text-primary outline-none focus:border-brand-purple/50 transition-all shadow-inner"
              />
              <button 
                type="button" 
                onClick={() => setShowPw(!showPw)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-brand-purple text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <>
                PROVISION ACCOUNT <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-10 pt-8 border-t border-border-main text-center">
          <p className="text-xs text-text-muted font-medium">
            Already authorized?{' '}
            <Link to="/login" className="text-brand-purple font-black hover:underline underline-offset-4 ml-1">
              Secure Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
