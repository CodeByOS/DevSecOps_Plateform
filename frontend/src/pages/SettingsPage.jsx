import { useState } from 'react';
import { User, Lock, CheckCircle, AlertCircle, Save } from 'lucide-react';
import Card from '../components/ui/Card';
import useAuth from '../hooks/useAuth';
import client from '../api/client';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: 'var(--text-muted)',
  marginBottom: 6,
  fontWeight: 600,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>
      <div>
        <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 28, fontWeight: 700 }}>Settings</h2>
        <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 8 }}>
          Manage your account and preferences
        </div>
      </div>

      {/* Profile Section */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--blue), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Profile</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update your display name</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <div style={{ ...inputStyle, color: 'var(--text-muted)', cursor: 'default', border: '1px solid var(--border-subtle)' }}>
              {user?.email}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <div style={{ ...inputStyle, color: 'var(--text-muted)', cursor: 'default', border: '1px solid var(--border-subtle)', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {profileError && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} />{profileError}
            </div>
          )}
          {profileSuccess && (
            <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={14} />Profile updated successfully!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={profileLoading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: profileLoading ? 'var(--border)' : 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: profileLoading ? 'not-allowed' : 'pointer' }}>
              <Save size={15} />{profileLoading ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Card>

      {/* Password Section */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--orange), var(--red))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Change Password</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Must be at least 6 characters</div>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Current Password', val: currentPassword, setter: setCurrentPassword },
            { label: 'New Password', val: newPassword, setter: setNewPassword },
            { label: 'Confirm New Password', val: confirmPassword, setter: setConfirmPassword },
          ].map(({ label, val, setter }) => (
            <div key={label}>
              <label style={labelStyle}>{label}</label>
              <input type="password" value={val} onChange={(e) => setter(e.target.value)} placeholder="••••••••" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}

          {pwError && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} />{pwError}
            </div>
          )}
          {pwSuccess && (
            <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={14} />Password changed successfully!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={pwLoading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: pwLoading ? 'var(--border)' : 'var(--orange)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: pwLoading ? 'not-allowed' : 'pointer' }}>
              <Lock size={15} />{pwLoading ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SettingsPage;
