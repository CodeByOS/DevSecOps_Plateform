import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, Copy, Check, ChevronLeft, ExternalLink, 
  Settings, Users, Shield, Zap, Activity, 
  Search, Filter, ChevronRight, MoreVertical,
  Mail, MessageSquare, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { addMember, removeMember, updateProject, deleteProject } from '../api/projects';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import MiniTrend from '../components/charts/MiniTrend';
import useProject from '../hooks/useProject';
import usePipelines from '../hooks/usePipelines';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { project, setProject, loading, error } = useProject(id);
  useDocumentTitle(project?.name ? `Project: ${project.name}` : 'Project Detail');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const isAdmin = user?.role === 'admin';
  
  const statusFilter = searchParams.get('status') || '';
  const branchFilter = searchParams.get('branch') || '';
  const pipelinePage = parseInt(searchParams.get('page') || '1');

  const { pipelines, meta, loading: pipelineLoading, error: pipelineError } = usePipelines(id, { 
    page: pipelinePage, 
    limit: 10,
    status: statusFilter || undefined,
    branch: branchFilter || undefined
  });

  const [gateForm, setGateForm] = useState({
    mode: 'block',
    threshold: 70,
    notifySlack: false,
    notifyEmail: false,
    emailRecipients: '',
  });

  const [savingGate, setSavingGate] = useState(false);
  const [gateError, setGateError] = useState('');
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'developer' });
  const [memberError, setMemberError] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [removingId, setRemovingId] = useState('');
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!project) return;
    setGateForm({
      mode: project.gateConfig?.mode ?? 'block',
      threshold: project.gateConfig?.threshold ?? 70,
      notifySlack: Boolean(project.gateConfig?.notifySlack),
      notifyEmail: Boolean(project.gateConfig?.notifyEmail),
      emailRecipients: project.gateConfig?.emailRecipients?.join(', ') ?? '',
    });
  }, [project]);

  const updateFilters = useCallback((newFilters) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      if (!newFilters.page && next.get('page')) next.set('page', '1');
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

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This action is irreversible.`)) return;
    setDeleting(true);
    try {
      await deleteProject(project._id);
      success('Project deleted successfully');
      navigate('/projects');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete project');
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
    return { scores, avg, blocked };
  }, [pipelines]);

  if (loading) return <div className="flex items-center justify-center p-20 text-text-muted font-bold animate-pulse">Initializing project data...</div>;
  if (!project && !loading) return <Card className="p-12 text-center text-text-muted">Project resources not found.</Card>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link to="/projects" className="bg-bg-elevated p-3 rounded-xl border border-border-main text-text-muted hover:text-text-primary hover:border-brand-blue/50 transition-all shadow-lg shadow-black/20">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-text-primary tracking-tight">{project.name}</h1>
              <div className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded-md text-[10px] font-black uppercase tracking-widest">
                Active
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold bg-bg-elevated/50 px-2.5 py-1 rounded-lg border border-border-main">
                <ExternalLink size={12} />
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue transition-colors truncate max-w-[240px]">
                  {project.repoUrl}
                </a>
              </div>
              <div className="text-[10px] font-black text-text-muted/50 uppercase tracking-tighter">
                UID: {project._id}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {(isAdmin || project.owner?._id === user?._id) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeleteProject}
              disabled={deleting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-red/30 bg-brand-red/5 text-brand-red text-sm font-bold hover:bg-brand-red/10 transition-all shadow-lg shadow-brand-red/5"
            >
              <Trash2 size={18} />
              {deleting ? 'Terminating...' : 'Delete Project'}
            </motion.button>
          )}
        </div>
      </header>

      {(error || pipelineError || gateError || memberError) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-red/10 border border-brand-red/30 text-brand-red px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 shadow-xl"
        >
          <AlertTriangle size={18} />
          {error || pipelineError || gateError || memberError}
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Overview */}
        <Card className="lg:col-span-2 relative group overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
                  <Activity size={18} />
                </div>
                <h3 className="text-lg font-black text-text-primary tracking-tight">Project Architecture</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Health Index</p>
                  <p className={`text-xl font-black ${parseFloat(health.avg) > 70 ? 'text-brand-red' : 'text-brand-green'}`}>{health.avg}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Operational Summary</p>
                  <p className="text-sm text-text-secondary leading-relaxed font-medium">
                    {project.description || 'This project acts as a secure container for continuous integration and security scanning of the specified repository.'}
                  </p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Main Branch</p>
                    <div className="font-mono text-xs text-brand-blue bg-brand-blue/10 px-2 py-1 rounded-md border border-brand-blue/20 inline-block font-bold">
                      {project.defaultBranch ?? 'main'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Interceptions</p>
                    <p className="text-sm font-black text-brand-red">{health.blocked} runs</p>
                  </div>
                </div>
              </div>

              <div className="bg-bg-elevated/50 p-6 rounded-2xl border border-border-main flex flex-col justify-center gap-4">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Recent Performance</p>
                <div className="h-[80px]">
                  <MiniTrend data={health.scores.length ? health.scores : [20, 15, 25, 18, 22]} color="#4fa3ff" />
                </div>
                <p className="text-[10px] text-center text-text-muted italic">Score trend across last 10 executions</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 blur-[60px] rounded-full pointer-events-none" />
        </Card>

        {/* Webhook Config */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-purple/10 text-brand-purple rounded-lg">
              <Zap size={18} />
            </div>
            <h3 className="text-lg font-black text-text-primary tracking-tight tracking-tighter">Connectivity</h3>
          </div>

          <div className="space-y-5 flex-1">
            <div className="p-4 bg-bg-elevated/40 rounded-xl border border-border-main space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Webhook Endpoint</p>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyWebhook}
                  className={`p-1.5 rounded-md border transition-all ${copied ? 'bg-brand-green/20 border-brand-green/50 text-brand-green' : 'bg-bg-elevated border-border-main text-text-muted hover:text-text-primary'}`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </motion.button>
              </div>
              <div className="font-mono text-[11px] text-text-secondary truncate bg-black/20 p-2 rounded border border-white/5">
                {window.location.origin}/api/webhooks/github?projectId={project._id}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-bg-elevated/40 rounded-xl border border-border-main space-y-2">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Auth Secret</p>
                <div className="font-mono text-xs text-brand-purple font-black truncate">{project.webhookSecret}</div>
              </div>
              <div className="p-4 bg-bg-elevated/40 rounded-xl border border-border-main space-y-2">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Format</p>
                <div className="font-mono text-xs text-text-secondary font-bold">JSON</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border-main flex items-center gap-3 text-text-muted">
            <ShieldCheck size={16} className="text-brand-green" />
            <p className="text-[10px] font-bold">TLS encrypted endpoint</p>
          </div>
        </Card>

        {/* Gate Configuration */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-lg">
                <Shield size={18} />
              </div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">Security Gate Control</h3>
            </div>
            <div className="px-3 py-1 bg-brand-orange/10 border border-brand-orange/20 rounded-full text-[10px] font-black text-brand-orange uppercase">
              {gateForm.mode} Enabled
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Enforcement Strategy</label>
                <select
                  value={gateForm.mode}
                  onChange={(e) => setGateForm((prev) => ({ ...prev, mode: e.target.value }))}
                  className="w-full bg-bg-elevated border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-brand-blue/50 transition-colors"
                >
                  <option value="block">BLOCK (Strict Compliance)</option>
                  <option value="warn">WARN (Active Notification)</option>
                  <option value="allow">ALLOW (Audit Trail Only)</option>
                </select>
                <p className="text-[10px] text-text-muted font-medium italic">
                  {gateForm.mode === 'block' ? 'Intercepts and stops pipelines exceeding threshold.' : gateForm.mode === 'warn' ? 'Alerts stakeholders but allows pipeline to proceed.' : 'Records results without active intervention.'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Risk Threshold (0-100)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={gateForm.threshold}
                    onChange={(e) => setGateForm((prev) => ({ ...prev, threshold: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border-main rounded-xl px-4 py-3 text-sm font-black text-text-primary outline-none focus:border-brand-blue/50 transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/50 font-black">
                    PTS
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-bg-elevated/30 p-6 rounded-2xl border border-border-main">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Automated Alerts</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setGateForm(p => ({ ...p, notifySlack: !p.notifySlack }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${gateForm.notifySlack ? 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue shadow-lg shadow-brand-blue/5' : 'bg-bg-card border-border-main text-text-muted hover:border-text-muted/30'}`}
                  >
                    <MessageSquare size={16} />
                    <span className="text-xs font-bold">Slack</span>
                    {gateForm.notifySlack && <Check size={12} className="ml-auto" />}
                  </button>
                  <button 
                    onClick={() => setGateForm(p => ({ ...p, notifyEmail: !p.notifyEmail }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${gateForm.notifyEmail ? 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue shadow-lg shadow-brand-blue/5' : 'bg-bg-card border-border-main text-text-muted hover:border-text-muted/30'}`}
                  >
                    <Mail size={16} />
                    <span className="text-xs font-bold">Email</span>
                    {gateForm.notifyEmail && <Check size={12} className="ml-auto" />}
                  </button>
                </div>
              </div>

              {gateForm.notifyEmail && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Recipients</label>
                  <input
                    value={gateForm.emailRecipients}
                    onChange={(e) => setGateForm((prev) => ({ ...prev, emailRecipients: e.target.value }))}
                    placeholder="security@acme.com, eng-leads@acme.com"
                    className="w-full bg-bg-card border border-border-main rounded-xl px-4 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-brand-blue/50 transition-colors"
                  />
                </motion.div>
              )}

              <div className="flex justify-end pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={saveGateConfig}
                  disabled={savingGate}
                  className="px-6 py-2.5 bg-brand-blue text-white rounded-xl text-sm font-black shadow-lg shadow-brand-blue/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingGate ? <Activity size={16} className="animate-spin" /> : <ShieldCheck size={18} />}
                  {savingGate ? 'Applying...' : 'Update Policy'}
                </motion.button>
              </div>
            </div>
          </div>
        </Card>

        {/* Team Management */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand-green/10 text-brand-green rounded-lg">
              <Users size={18} />
            </div>
            <h3 className="text-lg font-black text-text-primary tracking-tight">Security Council</h3>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
            {/* Owner */}
            <div className="flex items-center gap-4 p-4 bg-brand-blue/10 border border-brand-blue/20 rounded-2xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <ShieldCheck size={40} className="text-brand-blue" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white font-black text-sm shadow-lg">
                {project.owner?.name?.[0]?.toUpperCase() ?? 'O'}
              </div>
              <div className="relative z-10">
                <p className="text-sm font-black text-text-primary">{project.owner?.name}</p>
                <p className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Account Owner</p>
              </div>
            </div>

            {/* Members */}
            <AnimatePresence>
              {project.members?.map(m => (
                <motion.div 
                  key={m.user?._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-4 bg-bg-elevated/40 border border-border-main rounded-2xl hover:bg-bg-elevated transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-bg-card border border-border-main flex items-center justify-center text-text-muted font-bold text-sm">
                      {m.user?.name?.[0]?.toUpperCase() ?? 'M'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{m.user?.name}</p>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{m.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m.user?._id)}
                    disabled={removingId === m.user?._id}
                    className="p-2 text-text-muted hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <form onSubmit={handleAddMember} className="mt-8 pt-8 border-t border-border-main space-y-4">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Authorize Personnel</p>
            <div className="flex gap-2">
              <input
                value={memberForm.userId}
                onChange={(e) => setMemberForm(p => ({ ...p, userId: e.target.value }))}
                placeholder="User ID / Email"
                className="flex-1 bg-bg-elevated border border-border-main rounded-xl px-4 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-brand-blue/50"
              />
              <select
                value={memberForm.role}
                onChange={(e) => setMemberForm(p => ({ ...p, role: e.target.value }))}
                className="w-24 bg-bg-elevated border border-border-main rounded-xl px-2 py-2.5 text-xs font-bold text-text-primary outline-none"
              >
                <option value="developer">Dev</option>
                <option value="viewer">View</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={memberLoading}
                className="p-2.5 bg-brand-green text-white rounded-xl shadow-lg shadow-brand-green/20"
              >
                <Check size={18} />
              </motion.button>
            </div>
          </form>
        </Card>
      </div>

      {/* Execution History */}
      <Card className="relative overflow-visible">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
              <ScrollText size={18} />
            </div>
            <h3 className="text-lg font-black text-text-primary tracking-tight">Intelligence Logs</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-blue transition-colors" />
              <select
                value={statusFilter}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="bg-bg-elevated border border-border-main rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-text-primary outline-none focus:border-brand-blue/50 appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
              </select>
            </div>
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-blue transition-colors" />
              <input
                value={branchFilter}
                onChange={(e) => updateFilters({ branch: e.target.value })}
                placeholder="Search branch..."
                className="bg-bg-elevated border border-border-main rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-text-primary outline-none focus:border-brand-blue/50 w-48"
              />
            </div>
          </div>
        </div>

        {pipelineLoading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Fetching execution stream...</p>
          </div>
        ) : pipelines.length === 0 ? (
          <div className="py-20 text-center bg-bg-elevated/20 rounded-3xl border-2 border-dashed border-border-main">
            <p className="text-sm font-bold text-text-muted">No telemetry matches your filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-2xl border border-border-main">
              <table className="w-full text-left">
                <thead className="bg-bg-elevated/50 text-[10px] font-black text-text-muted uppercase tracking-[0.15em]">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Branch / Trigger</th>
                    <th className="px-6 py-4 text-center">Risk Index</th>
                    <th className="px-6 py-4">Security Decision</th>
                    <th className="px-6 py-4">Execution Time</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {pipelines.map(p => (
                    <tr key={p._id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-5"><StatusBadge status={p.status} /></td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-text-primary">{p.branch}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter truncate max-w-[120px]">
                          {p.commitSha?.slice(0, 7) || 'Manual Trigger'}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className={`font-mono text-sm font-black ${p.score > (project.gateConfig?.threshold ?? 70) ? 'text-brand-red' : 'text-brand-green'}`}>
                          {p.score ?? '—'}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {p.decision === 'approved' && (
                          <div className="flex items-center gap-2 text-brand-green text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck size={14} /> Approved
                          </div>
                        )}
                        {p.decision === 'blocked' && (
                          <div className="flex items-center gap-2 text-brand-red text-[10px] font-black uppercase tracking-widest">
                            <Shield size={14} /> Blocked
                          </div>
                        )}
                        {p.decision === 'override' && (
                          <div className="flex items-center gap-2 text-brand-orange text-[10px] font-black uppercase tracking-widest">
                            <AlertTriangle size={14} /> Override
                          </div>
                        )}
                        {!p.decision && <span className="text-text-muted/50 font-black">—</span>}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-text-primary">{new Date(p.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] text-text-muted font-medium">{new Date(p.createdAt).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link to={`/pipelines/${p._id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-bg-elevated border border-border-main text-text-muted hover:text-brand-blue hover:border-brand-blue transition-all group-hover:shadow-lg">
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                Telemetry Page <span className="text-text-primary">{meta.page}</span> OF <span className="text-text-primary">{meta.pages}</span> <span className="mx-2 text-text-muted/30">|</span> <span className="text-text-primary">{meta.total}</span> TOTAL SESSIONS
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateFilters({ page: String(pipelinePage - 1) })}
                  disabled={pipelinePage <= 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border-main text-xs font-black text-text-muted hover:text-text-primary hover:border-brand-blue transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} /> PREV
                </button>
                <button
                  onClick={() => updateFilters({ page: String(pipelinePage + 1) })}
                  disabled={pipelinePage >= meta.pages}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border-main text-xs font-black text-text-muted hover:text-text-primary hover:border-brand-blue transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  NEXT <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProjectDetailPage;
