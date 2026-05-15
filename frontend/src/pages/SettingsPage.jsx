import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Lock, CheckCircle, AlertCircle, Save, 
  Settings, Mail, Shield, UserCheck, Key, 
  RefreshCw, Fingerprint
} from 'lucide-react';
import Card from '../components/ui/Card';
import useAuth from '../hooks/useAuth';
import client from '../api/client';

const SettingsPage = () => {
  const { user } = useAuth();

  // Profile form
  const [name, setName] = useState(user?.name ?? '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    if (!name.trim()) { setProfileError('IDENTIFIER ERROR: Name vector cannot be null.'); return; }
    setProfileLoading(true);
    try {
      await client.put('/auth/profile', { name: name.trim() });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.message ?? 'UPDATE FAILURE: Service sync failed.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('FIELD ERROR: All authorization vectors required.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('SECURITY POLICY: Minimum entropy not met (6+ chars).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('MISMATCH: Confirmation vector does not align.');
      return;
    }
    setPwLoading(true);
    try {
      await client.put('/auth/password', { currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.response?.data?.message ?? 'REKEY FAILURE: Current authorization denied.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-widest">
          <Settings size={14} />
          System Configuration
        </div>
        <h1 className="text-4xl font-black text-text-primary tracking-tight">Account Parameters</h1>
        <p className="text-text-muted text-sm max-w-lg font-medium">
          Manage personnel identification, authorization credentials, and security preferences.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Section */}
        <Card className="relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-gradient-to-br from-brand-blue to-brand-purple rounded-2xl shadow-lg shadow-brand-blue/20">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight uppercase tracking-tighter">Personnel Profile</h3>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Public Identity Vector</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Assigned Email</label>
              <div className="flex items-center gap-3 bg-bg-elevated/50 border border-border-main/50 rounded-xl px-4 py-3 text-sm font-bold text-text-muted cursor-not-allowed group-hover:border-border-main transition-colors shadow-inner">
                <Mail size={16} className="opacity-40" />
                {user?.email}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Access Level</label>
              <div className="flex items-center gap-3 bg-bg-elevated/50 border border-border-main/50 rounded-xl px-4 py-3 text-sm font-bold text-text-muted cursor-not-allowed group-hover:border-border-main transition-colors shadow-inner capitalize">
                <Shield size={16} className="opacity-40 text-brand-blue" />
                {user?.role} Access
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Display Pseudonym</label>
              <div className="relative group/input">
                <UserCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/input:text-brand-blue transition-colors" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Personnel Name"
                  className="w-full bg-bg-card border border-border-main rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-brand-blue/50 transition-all shadow-inner"
                />
              </div>
            </div>

            <AnimatePresence>
              {profileError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-brand-red/5"
                >
                  <AlertCircle size={16} />
                  {profileError}
                </motion.div>
              )}
              {profileSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-brand-green/10 border border-brand-green/30 text-brand-green rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-brand-green/5"
                >
                  <CheckCircle size={16} />
                  IDENTITY PARAMETERS SYNCED SUCCESSFULLY
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={profileLoading} 
                className="flex items-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/40 transition-all disabled:opacity-50"
              >
                {profileLoading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {profileLoading ? 'SYNCING...' : 'UPDATE IDENTITY'}
              </motion.button>
            </div>
          </form>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 blur-[60px] rounded-full pointer-events-none" />
        </Card>

        {/* Password Section */}
        <Card className="relative overflow-hidden">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-gradient-to-br from-brand-orange to-brand-red rounded-2xl shadow-lg shadow-brand-orange/20">
              <Key size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight uppercase tracking-tighter">Authorization Key</h3>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Entropy & Credential Management</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Current Token', val: currentPassword, setter: setCurrentPassword, icon: Lock },
                { label: 'New Vector', val: newPassword, setter: setNewPassword, icon: Fingerprint },
                { label: 'Verify Vector', val: confirmPassword, setter: setConfirmPassword, icon: Fingerprint },
              ].map(({ label, val, setter, icon: Icon }) => (
                <div key={label} className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{label}</label>
                  <div className="relative group/input">
                    <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/input:text-brand-orange transition-colors" />
                    <input 
                      type="password" 
                      value={val} 
                      onChange={(e) => setter(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full bg-bg-card border border-border-main rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-brand-orange/50 transition-all shadow-inner"
                    />
                  </div>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {pwError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-brand-red/5"
                >
                  <AlertCircle size={16} />
                  {pwError}
                </motion.div>
              )}
              {pwSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-brand-green/10 border border-brand-green/30 text-brand-green rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-brand-green/5"
                >
                  <CheckCircle size={16} />
                  AUTHORIZATION TOKEN RECALIBRATED SUCCESSFULLY
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={pwLoading} 
                className="flex items-center gap-2 px-8 py-3 bg-brand-orange text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-orange/20 hover:shadow-brand-orange/40 transition-all disabled:opacity-50"
              >
                {pwLoading ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
                {pwLoading ? 'REKEYING...' : 'RECALIBRATE TOKEN'}
              </motion.button>
            </div>
          </form>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-orange/5 blur-[60px] rounded-full pointer-events-none" />
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
