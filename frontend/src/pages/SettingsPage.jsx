import { useState } from 'react';
import { User, Lock, CheckCircle, AlertCircle, Save, Settings, Mail, Shield, ShieldAlert, KeyRound } from 'lucide-react';
import Card from '../components/ui/Card';
import useAuth from '../hooks/useAuth';
import client from '../api/client';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'all 0.2s',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: 'var(--text-muted)',
  marginBottom: 8,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

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
    if (!name.trim()) { setProfileError('Name cannot be empty.'); return; }
    setProfileLoading(true);
    try {
      await client.put('/auth/profile', { name: name.trim() });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.message ?? 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All password fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
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
      setPwError(err.response?.data?.message ?? 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: 14, 
          background: 'var(--bg-elevated)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
        }}>
          <Settings size={24} color="var(--text-secondary)" strokeWidth={2} />
        </div>
        <div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Settings</h2>
          <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
            Manage your account, security preferences, and global configurations
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {/* Profile Section */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(79, 163, 255, 0.2)' }}>
                <User size={20} color="var(--blue)" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Personal Profile</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Publicly visible account information</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <div style={{ ...inputStyle, paddingLeft: 42, color: 'var(--text-muted)', cursor: 'not-allowed', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.1)' }}>
                  {user?.email}
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Access Level</label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <div style={{ ...inputStyle, paddingLeft: 42, color: 'var(--text-muted)', cursor: 'not-allowed', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.1)', textTransform: 'capitalize' }}>
                  {user?.role}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={labelStyle}>Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {profileError && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <AlertCircle size={16} />{profileError}
              </div>
            )}
            {profileSuccess && (
              <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', padding: '12px 16px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <CheckCircle size={16} />Profile updated successfully!
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button 
                type="submit" 
                disabled={profileLoading} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '12px 24px', 
                  borderRadius: 12, 
                  border: 'none', 
                  background: profileLoading ? 'var(--border)' : 'var(--blue)', 
                  color: '#fff', 
                  fontSize: 14, 
                  fontWeight: 700, 
                  cursor: profileLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 163, 255, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if(!profileLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                <Save size={18} />
                {profileLoading ? 'Saving changes…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Card>

        {/* Password Section */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(241, 122, 95, 0.2)' }}>
              <Lock size={20} color="var(--red)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Security & Authentication</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Update your password to keep your account secure</div>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div>
                <label style={labelStyle}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: 42 }}
                    onFocus={e => e.target.style.borderColor = 'var(--red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                 <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={14} color="var(--orange)" />
                    Password must be at least 6 characters
                 </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle}>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {pwError && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <AlertCircle size={16} />{pwError}
              </div>
            )}
            {pwSuccess && (
              <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', padding: '12px 16px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <CheckCircle size={16} />Password changed successfully!
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button 
                type="submit" 
                disabled={pwLoading} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '12px 24px', 
                  borderRadius: 12, 
                  border: 'none', 
                  background: pwLoading ? 'var(--border)' : 'var(--red)', 
                  color: '#fff', 
                  fontSize: 14, 
                  fontWeight: 700, 
                  cursor: pwLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(241, 122, 95, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if(!pwLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                <Lock size={18} />
                {pwLoading ? 'Updating password…' : 'Update Password'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
