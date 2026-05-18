import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, Copy, Check, ChevronLeft, ExternalLink, Settings, Users, Shield, Zap, AlertTriangle } from 'lucide-react';
import { addMember, removeMember, updateProject, deleteProject } from '../api/projects';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import MiniTrend from '../components/charts/MiniTrend';
import useProject from '../hooks/useProject';
import usePipelines from '../hooks/usePipelines';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const tableCell = {
  padding: '12px 10px',
  borderBottom: '1px solid var(--border-subtle)',
  fontSize: 13,
};

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { project, setProject, loading, error } = useProject(id);
  useDocumentTitle(project?.name ? `Project: ${project.name}` : 'Project Detail');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const isAdmin = user?.role === 'admin';

  // URL-persistent filters
  const statusFilter = searchParams.get('status') || '';
  const decisionFilter = searchParams.get('decision') || '';
  const branchFilter = searchParams.get('branch') || '';
  const pipelinePage = parseInt(searchParams.get('page') || '1');

  const { pipelines, meta, loading: pipelineLoading, error: pipelineError } = usePipelines(id, {
    page: pipelinePage,
    limit: 10,
    status: statusFilter || undefined,
    decision: decisionFilter || undefined,
    branch: branchFilter || undefined
  });

  const [gateForm, setGateForm] = useState({
    mode: 'block',
    threshold: 70,
    notifySlack: false,
    notifyEmail: false,
    emailRecipients: '',
    stagingUrl: '',
  });

  const [savingGate, setSavingGate] = useState(false);
  const [gateError, setGateError] = useState('');
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'developer' });
  const [memberError, setMemberError] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [removingId, setRemovingId] = useState('');
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!project) return;
    setGateForm({
      mode: project.gateConfig?.mode ?? 'block',
      threshold: project.gateConfig?.threshold ?? 70,
      notifySlack: Boolean(project.gateConfig?.notifySlack),
      notifyEmail: Boolean(project.gateConfig?.notifyEmail),
      emailRecipients: project.gateConfig?.emailRecipients?.join(', ') ?? '',
      stagingUrl: project.stagingUrl ?? '',
    });
  }, [project]);

  const updateFilters = useCallback((newFilters) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      if (!newFilters.page && next.get('page')) next.set('page', '1'); // Reset page on filter change
      return next;
    });
  }, [setSearchParams]);

  const handleCopyWebhook = () => {
    const url = `${window.location.origin}/api/webhooks/github?projectId=${project._id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    success('Webhook URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteProject = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    setDeleting(true);
    try {
      await deleteProject(project._id);
      success('Project deleted successfully');
      navigate('/projects');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete project');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const saveGateConfig = async () => {
    if (!project) return;
    setGateError('');
    setSavingGate(true);
    try {
      const payload = {
        stagingUrl: gateForm.stagingUrl.trim(),
        gateConfig: {
          mode: gateForm.mode,
          threshold: Number(gateForm.threshold) || 0,
          notifySlack: gateForm.notifySlack,
          notifyEmail: gateForm.notifyEmail,
          emailRecipients: gateForm.emailRecipients
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
      };
      const { data } = await updateProject(project._id, payload);
      setProject(data.data);
      success('Gate configuration updated');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to update gate configuration.';
      setGateError(msg);
      toastError(msg);
    } finally {
      setSavingGate(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!project) return;
    setMemberError('');
    if (!memberForm.userId.trim()) {
      setMemberError('User ID is required.');
      return;
    }
    setMemberLoading(true);
    try {
      const { data } = await addMember(project._id, { userId: memberForm.userId.trim(), role: memberForm.role });
      setProject(data.data);
      setMemberForm({ userId: '', role: 'developer' });
      success('Member added successfully');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to add member.';
      setMemberError(msg);
      toastError(msg);
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!project) return;
    setMemberError('');
    setRemovingId(userId);
    try {
      const { data } = await removeMember(project._id, userId);
      setProject(data.data);
      success('Member removed');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to remove member.';
      setMemberError(msg);
      toastError(msg);
    } finally {
      setRemovingId('');
    }
  };

  const health = useMemo(() => {
    const scores = pipelines.map((p) => p.score).filter((v) => typeof v === 'number');
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
    const blocked = pipelines.filter((p) => p.status === 'blocked').length;
    const last = pipelines[0];
    return { scores, avg, blocked, last };
  }, [pipelines]);

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Loading project details…</div>;
  if (!project && !loading) return <Card>Project not found.</Card>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/projects" style={{ background: 'var(--bg-elevated)', padding: 8, borderRadius: 8, color: 'var(--text-muted)' }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 24, fontWeight: 700 }}>{project.name}</h2>
              <span className="metric-chip" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>ID: {project._id}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              <ExternalLink size={14} />
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                {project.repoUrl}
              </a>
            </div>
          </div>
        </div>
        {(isAdmin || project.owner?._id === user?._id) && (
          <button
            onClick={handleDeleteProject}
            disabled={deleting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--red-dim)',
              background: 'transparent',
              color: 'var(--red)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Trash2 size={16} />
            {deleting ? 'Deleting...' : 'Delete Project'}
          </button>
        )}
      </div>

      {(error || pipelineError || gateError || memberError) && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
          {error || pipelineError || gateError || memberError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <Card>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} /> Overview & Health
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Description</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{project.description || 'No description provided.'}</div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, marginTop: 16 }}>Default Branch</div>
              <div className="font-mono" style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>{project.defaultBranch ?? 'main'}</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Performance</div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Avg Score</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{health.avg}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Blocked</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{health.blocked}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <MiniTrend data={health.scores.length ? health.scores : [20, 15, 25, 18, 22]} color="var(--blue)" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="var(--purple)" /> Webhook Configuration
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Payload URL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="font-mono" style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {window.location.origin}/api/webhooks/github?projectId={project._id}
                </div>
                <button
                  onClick={handleCopyWebhook}
                  style={{ background: 'transparent', border: 'none', color: copied ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Secret Key</div>
                <div className="font-mono" style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 600 }}>{project.webhookSecret}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Content Type</div>
                <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>application/json</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: 20 }}>
        <Card>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="var(--orange)" /> Gate Configuration
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>ENFORCEMENT MODE</label>
              <select
                value={gateForm.mode}
                onChange={(e) => setGateForm((prev) => ({ ...prev, mode: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="block">BLOCK (Strict)</option>
                <option value="warn">WARN (Notify only)</option>
                <option value="allow">ALLOW (Audit only)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>RISK THRESHOLD (0-100)</label>
              <input
                type="number"
                value={gateForm.threshold}
                onChange={(e) => setGateForm((prev) => ({ ...prev, threshold: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
              STAGING URL (for DAST scanning)
            </label>
            <input
              value={gateForm.stagingUrl}
              onChange={(e) => setGateForm((prev) => ({ ...prev, stagingUrl: e.target.value }))}
              placeholder="https://staging.your-portfolio.com"
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Leave empty to skip the DAST step
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>NOTIFICATIONS</label>
            <div style={{ display: 'flex', gap: 24, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={gateForm.notifySlack} onChange={(e) => setGateForm(p => ({ ...p, notifySlack: e.target.checked }))} /> Slack
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={gateForm.notifyEmail} onChange={(e) => setGateForm(p => ({ ...p, notifyEmail: e.target.checked }))} /> Email
              </label>
            </div>
          </div>

          {gateForm.notifyEmail && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>RECIPIENTS (comma separated)</label>
              <input
                value={gateForm.emailRecipients}
                onChange={(e) => setGateForm((prev) => ({ ...prev, emailRecipients: e.target.value }))}
                placeholder="security@acme.com, engineering@acme.com"
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button
              onClick={saveGateConfig}
              disabled={savingGate}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: savingGate ? 'var(--bg-hover)' : 'var(--blue)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              {savingGate ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} /> Team Management
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 200, overflowY: 'auto', paddingRight: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--blue-dim)', borderRadius: 8, border: '1px solid rgba(79, 163, 255, 0.2)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{project.owner?.name} (Owner)</span>
              <span style={{ fontSize: 11, color: 'var(--blue)', textTransform: 'uppercase', fontWeight: 700 }}>Owner</span>
            </div>
            {project.members?.map(m => (
              <div key={m.user?._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.role}</div>
                </div>
                <button
                  onClick={() => handleRemoveMember(m.user?._id)}
                  disabled={removingId === m.user?._id}
                  style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {removingId === m.user?._id ? '...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddMember} style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: 8 }}>
              <input
                value={memberForm.userId}
                onChange={(e) => setMemberForm(p => ({ ...p, userId: e.target.value }))}
                placeholder="User ID"
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13 }}
              />
              <select
                value={memberForm.role}
                onChange={(e) => setMemberForm(p => ({ ...p, role: e.target.value }))}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13 }}
              >
                <option value="developer">Dev</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={memberLoading}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: 'white', fontWeight: 600, fontSize: 12 }}
              >
                Add
              </button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pipeline Execution History</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <select
              value={statusFilter}
              onChange={(e) => updateFilters({ status: e.target.value })}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12 }}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
            </select>
            <input
              value={branchFilter}
              onChange={(e) => updateFilters({ branch: e.target.value })}
              placeholder="Filter branch..."
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12, width: 150 }}
            />
          </div>
        </div>

        {pipelineLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading pipelines…</div>
        ) : pipelines.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No pipelines match the current filters.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ textAlign: 'left', background: 'var(--bg-elevated)' }}>
                  <tr>
                    <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Branch</th>
                    <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Score</th>
                    <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Decision</th>
                    <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Execution Time</th>
                    <th style={tableCell}></th>
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map(p => (
                    <tr key={p._id} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tableCell}><StatusBadge status={p.status} /></td>
                      <td style={{ ...tableCell, fontWeight: 600 }}>{p.branch}</td>
                      <td style={{ ...tableCell, fontFamily: 'var(--font-mono)', fontWeight: 700, color: p.score > 70 ? 'var(--red)' : 'var(--text-primary)' }}>{p.score ?? '—'}</td>
                      <td style={{ ...tableCell, textTransform: 'capitalize' }}>
                        {p.decision === 'approved' && <span style={{ color: 'var(--green)' }}>Approved</span>}
                        {p.decision === 'blocked' && <span style={{ color: 'var(--red)' }}>Blocked</span>}
                        {p.decision === 'override' && <span style={{ color: 'var(--orange)' }}>Override</span>}
                        {!p.decision && '—'}
                      </td>
                      <td style={{ ...tableCell, color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleString()}</td>
                      <td style={{ ...tableCell, textAlign: 'right' }}>
                        <Link to={`/pipelines/${p._id}`} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>Details →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Page <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{meta.page}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{meta.pages}</span> ({meta.total} pipelines)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => updateFilters({ page: String(pipelinePage - 1) })}
                  disabled={pipelinePage <= 1}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: pipelinePage <= 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}
                >
                  Prev
                </button>
                <button
                  onClick={() => updateFilters({ page: String(pipelinePage + 1) })}
                  disabled={pipelinePage >= meta.pages}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: pipelinePage >= meta.pages ? 'not-allowed' : 'pointer', fontSize: 13 }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        title="Delete Project"
        footer={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteProject}
              disabled={deleting}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--red)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--red-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={24} color="var(--red)" />
          </div>
          <div>
            <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--text-primary)', fontSize: 16 }}>
              Are you absolutely sure?
            </p>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5 }}>
              This action cannot be undone. This will permanently delete the project
              <strong style={{ color: 'var(--text-primary)' }}> {project.name}</strong>,
              including all its pipeline history, scan results, and configuration.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
