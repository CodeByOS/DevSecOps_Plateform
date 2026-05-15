import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, GitBranch, GitCommit, Clock, Share2, Check, 
  ExternalLink, AlertTriangle, Info, ChevronRight, 
  ChevronLeft, Activity, Zap, ShieldAlert, ShieldCheck,
  Terminal, BarChart3, Fingerprint, Lock, Unlock
} from 'lucide-react';
import { overridePipeline, getPipeline } from '../api/pipelines';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import ScoreGauge from '../components/charts/ScoreGauge';
import useAuth from '../hooks/useAuth';
import usePipeline from '../hooks/usePipeline';
import useToast from '../hooks/useToast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PipelineDetailPage = () => {
  const { id } = useParams();
  useDocumentTitle(`Execution ${id?.slice(-6)}`);
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const isAdmin = user?.role === 'admin';
  const { pipeline, setPipeline, loading, error, refresh } = usePipeline(id);
  const [actionError, setActionError] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pipeline || (pipeline.status !== 'pending' && pipeline.status !== 'running')) return;
    const interval = setInterval(() => refresh(), 5000);
    return () => clearInterval(interval);
  }, [pipeline?.status, refresh]);

  const scan = pipeline?.scanResult;
  const gateMode = pipeline?.project?.gateConfig?.mode ?? 'block';
  const gateThreshold = pipeline?.project?.gateConfig?.threshold ?? 70;
  const scoreValue = scan?.mlScore?.score ?? pipeline?.score ?? 0;

  const timelineSteps = useMemo(() => {
    return (pipeline?.steps ?? []).map((step) => {
      const startedAt = step.startedAt ? new Date(step.startedAt) : null;
      const completedAt = step.completedAt ? new Date(step.completedAt) : null;
      const durationMs = startedAt && completedAt ? completedAt - startedAt : null;
      return { ...step, startedAt, completedAt, durationMs };
    });
  }, [pipeline]);

  const formatDuration = (ms) => {
    if (!ms || ms < 0) return '—';
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${min}m ${rem}s`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOverride = async () => {
    if (!overrideReason.trim()) return;
    setOverrideLoading(true);
    setActionError('');
    try {
      const { data } = await overridePipeline(id, { reason: overrideReason.trim() });
      setPipeline((prev) => ({ ...prev, ...data.data }));
      setOverrideReason('');
      success('Gate override applied successfully');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Override failed.';
      setActionError(msg);
      toastError(msg);
    } finally {
      setOverrideLoading(false);
    }
  };

  const getGithubCommitUrl = (repoUrl, sha) => {
    if (!repoUrl || !sha) return null;
    return `${repoUrl.replace('.git', '')}/commit/${sha}`;
  };

  const commitUrl = useMemo(() => getGithubCommitUrl(pipeline?.project?.repoUrl, pipeline?.commitSha), [pipeline]);

  if (loading && !pipeline) return <div className="flex items-center justify-center p-20 text-text-muted font-bold animate-pulse uppercase tracking-widest text-xs">Accessing telemetry stream...</div>;
  if (!pipeline && !loading) return <Card className="p-12 text-center text-text-muted">Execution ID not recognized in current scope.</Card>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link to={`/projects/${pipeline.project?._id}`} className="bg-bg-elevated p-3 rounded-xl border border-border-main text-text-muted hover:text-text-primary hover:border-brand-blue/50 transition-all shadow-lg shadow-black/20">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-text-primary tracking-tight">Execution Analysis</h1>
              <StatusBadge status={pipeline.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
              <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold">
                <GitBranch size={14} className="text-brand-blue" /> {pipeline.branch}
              </div>
              {pipeline.commitSha && (
                <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold">
                  <Fingerprint size={14} className="text-brand-purple" />
                  {commitUrl ? (
                    <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="text-text-primary hover:text-brand-blue transition-colors font-mono underline decoration-brand-blue/30 underline-offset-4">
                      {pipeline.commitSha.slice(0, 7)}
                    </a>
                  ) : <span className="font-mono">{pipeline.commitSha.slice(0, 7)}</span>}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold">
                <Clock size={14} /> {new Date(pipeline.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-main bg-bg-elevated/50 text-text-primary text-sm font-bold hover:bg-bg-elevated transition-all shadow-lg shadow-black/20"
          >
            {copied ? <Check size={18} className="text-brand-green" /> : <Share2 size={18} />}
            {copied ? 'Link Copied' : 'Share Analysis'}
          </motion.button>
        </div>
      </header>

      {(error || actionError) && (
        <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 shadow-xl shadow-brand-red/5">
          <AlertTriangle size={18} />
          {error || actionError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Final Decision</p>
          <div className="flex items-center justify-between">
            <h3 className={`text-2xl font-black tracking-tight ${
              pipeline.decision === 'blocked' ? 'text-brand-red' : 
              pipeline.decision === 'approved' ? 'text-brand-green' : 'text-brand-orange'
            }`}>
              {pipeline.decision ? pipeline.decision.toUpperCase() : 'PENDING'}
            </h3>
            {pipeline.decision === 'approved' ? <ShieldCheck className="text-brand-green/50" /> : <ShieldAlert className="text-brand-red/50" />}
          </div>
        </Card>
        <Card>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Criticality Index</p>
          <div className="flex items-center justify-between">
            <h3 className={`text-2xl font-black tracking-tight ${scoreValue > 70 ? 'text-brand-red' : scoreValue > 40 ? 'text-brand-orange' : 'text-brand-green'}`}>
              {scoreValue} <span className="text-sm text-text-muted font-bold">/ 100</span>
            </h3>
            <Activity className="text-brand-blue/50" />
          </div>
        </Card>
        <Card>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Compliance Mode</p>
          <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase">{gateMode}</h3>
        </Card>
        <Card>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Pass Threshold</p>
          <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase">{gateThreshold} PTS</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
                <Terminal size={18} />
              </div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">Execution Stream</h3>
            </div>
            
            <div className="space-y-0 pl-2">
              {timelineSteps.map((step, idx) => (
                <div key={step.name} className="flex gap-6 group">
                  <div className="flex flex-col items-center w-6">
                    <div className={`
                      w-4 h-4 rounded-full border-4 border-bg-card z-10 transition-all duration-500
                      ${step.status === 'completed' ? 'bg-brand-green shadow-[0_0_12px_rgba(66,199,127,0.4)]' : 
                        step.status === 'running' ? 'bg-brand-blue animate-pulse' : 
                        step.status === 'failed' ? 'bg-brand-red' : 'bg-bg-elevated'}
                    `} />
                    {idx < timelineSteps.length - 1 && (
                      <div className={`w-0.5 flex-1 transition-colors duration-500 ${step.status === 'completed' ? 'bg-brand-green/30' : 'bg-border-main'}`} />
                    )}
                  </div>
                  <div className="flex-1 pb-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-text-primary tracking-tight uppercase group-hover:text-brand-blue transition-colors">
                          {step.name.replace('_', ' ')}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          <span className={
                            step.status === 'completed' ? 'text-brand-green' : 
                            step.status === 'running' ? 'text-brand-blue' : 
                            step.status === 'failed' ? 'text-brand-red' : ''
                          }>{step.status}</span>
                          {step.durationMs && <span>· {formatDuration(step.durationMs)}</span>}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded border border-border-main">
                        {step.startedAt ? step.startedAt.toLocaleTimeString() : '—'}
                      </div>
                    </div>
                    
                    {step.error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-4 bg-brand-red/5 rounded-xl border border-brand-red/20 text-[11px] font-mono text-brand-red leading-relaxed shadow-inner"
                      >
                        <p className="font-black mb-1 opacity-70">EXECUTION ERROR:</p>
                        {step.error}
                      </motion.div>
                    )}
                    
                    {step.summary && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(step.summary).map(([key, val]) => (
                          <div key={key} className="p-2 bg-bg-elevated/50 rounded-lg border border-border-main/50">
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">{key}</p>
                            <p className="text-xs font-black text-text-primary">{String(val)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        </Card>

        {/* Risk Posture & Overrides */}
        <div className="space-y-6">
          <Card className="relative overflow-hidden shadow-brand-blue/5">
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
                <BarChart3 size={18} />
              </div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">Vulnerability Vector</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
              <div className="aspect-square w-full max-w-[160px] mx-auto">
                <ScoreGauge score={scoreValue} />
              </div>
              <div className="space-y-4">
                {[
                  { label: 'SAST Critical', val: scan?.sast?.critical ?? 0, color: 'text-brand-red' },
                  { label: 'SCA Critical', val: scan?.sca?.criticalCves ?? 0, color: 'text-brand-red' },
                  { label: 'DAST High', val: scan?.dast?.highAlerts ?? 0, color: 'text-brand-orange' },
                  { label: 'AI Probability', val: `${((scan?.mlScore?.probability ?? 0) * 100).toFixed(0)}%`, color: 'text-brand-blue' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-border-main/50 pb-2">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{item.label}</span>
                    <span className={`text-sm font-black ${item.color}`}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {pipeline.status === 'blocked' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-4 bg-brand-red/10 border border-brand-red/20 rounded-2xl flex gap-4 items-start relative z-10"
              >
                <ShieldAlert size={20} className="text-brand-red shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-text-primary mb-1 uppercase tracking-tight">Security Block Active</h4>
                  <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                    Analysis score ({scoreValue}) exceeds the designated threshold ({gateThreshold}). System has automatically intercepted this delivery.
                  </p>
                </div>
              </motion.div>
            )}

            {pipeline.decision === 'override' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-4 bg-brand-blue/10 border border-brand-blue/20 rounded-2xl flex gap-4 items-start relative z-10 shadow-lg shadow-brand-blue/5"
              >
                <div className="p-2 bg-brand-blue/20 rounded-lg text-brand-blue">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-text-primary mb-1 uppercase tracking-tight">Administrative Override</h4>
                  <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                    Approved by <span className="text-brand-blue font-bold">{pipeline.overrideBy?.name}</span>
                  </p>
                  <div className="mt-3 p-2 bg-black/20 rounded text-[11px] italic text-text-muted border border-white/5">
                    "{pipeline.overrideReason}"
                  </div>
                </div>
              </motion.div>
            )}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-blue/5 blur-[60px] rounded-full pointer-events-none" />
          </Card>

          {isAdmin && pipeline.status === 'blocked' && (
            <Card className="bg-gradient-to-br from-brand-orange/5 to-transparent border-brand-orange/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-lg">
                  <Unlock size={18} />
                </div>
                <h3 className="text-sm font-black text-text-primary tracking-tight uppercase">Manual Authorization</h3>
              </div>
              <p className="text-[11px] text-text-secondary font-medium mb-5 leading-relaxed">
                As an authorized administrator, you may override the automated security gate. A valid justification is required for the audit trail.
              </p>
              <div className="space-y-4">
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Provide technical justification for this override..."
                  className="w-full h-24 bg-bg-card border border-border-main rounded-xl text-xs font-medium text-text-primary p-4 outline-none focus:border-brand-orange/50 transition-colors resize-none shadow-inner"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOverride}
                  disabled={overrideLoading || !overrideReason.trim()}
                  className="w-full py-3 bg-brand-orange text-white rounded-xl text-sm font-black shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale transition-all"
                >
                  {overrideLoading ? <Activity size={18} className="animate-spin" /> : <Lock size={18} />}
                  {overrideLoading ? 'AUTHORIZING...' : 'BYPASS SECURITY GATE'}
                </motion.button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Detailed Scan Results */}
      <Card>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-bg-elevated text-text-muted rounded-lg border border-border-main">
            <Search size={18} />
          </div>
          <h3 className="text-lg font-black text-text-primary tracking-tight">Intelligence Breakdown</h3>
        </div>

        <div className="space-y-4">
          {[
            {
              id: 'sast',
              name: 'SAST Analysis',
              engine: 'SonarQube Engine',
              icon: <Shield className="text-brand-blue" />,
              bg: 'bg-brand-blue/10',
              data: scan?.sast?.issues || [],
              countLabel: 'Detected Issues',
              cols: ['Severity', 'Rule Set', 'Locality'],
              renderRow: (issue, i) => (
                <tr key={i} className="group hover:bg-white/[0.01] transition-colors border-t border-border-main/50">
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${issue.severity === 'critical' ? 'text-brand-red' : 'text-text-primary'}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-text-secondary">{issue.ruleId}</td>
                  <td className="px-4 py-4 text-[11px] font-mono text-text-muted truncate max-w-xs">{issue.filePath}:{issue.line}</td>
                </tr>
              )
            },
            {
              id: 'sca',
              name: 'SCA Audit',
              engine: 'Dependency Check',
              icon: <Zap className="text-brand-purple" />,
              bg: 'bg-brand-purple/10',
              data: scan?.sca?.cves || [],
              countLabel: 'CVE Identifiers',
              cols: ['Vulnerability ID', 'Impact', 'Software Package'],
              renderRow: (cve, i) => (
                <tr key={i} className="group hover:bg-white/[0.01] transition-colors border-t border-border-main/50">
                  <td className="px-4 py-4 font-mono text-xs font-black text-brand-purple">{cve.cveId}</td>
                  <td className="px-4 py-4"><span className="text-[10px] font-black uppercase tracking-widest text-text-primary">{cve.severity}</span></td>
                  <td className="px-4 py-4 text-xs font-bold text-text-secondary">{cve.packageName} <span className="text-[10px] text-text-muted font-normal ml-2">→ Fixed in {cve.fixedVersion || 'N/A'}</span></td>
                </tr>
              )
            },
            {
              id: 'dast',
              name: 'DAST Analysis',
              engine: 'OWASP ZAP',
              icon: <ShieldAlert className="text-brand-orange" />,
              bg: 'bg-brand-orange/10',
              data: scan?.dast?.alerts || [],
              countLabel: 'Security Alerts',
              cols: ['Criticality', 'Security Finding', 'Network Endpoint'],
              renderRow: (alert, i) => (
                <tr key={i} className="group hover:bg-white/[0.01] transition-colors border-t border-border-main/50">
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${alert.risk === 'High' ? 'text-brand-red' : 'text-text-primary'}`}>
                      {alert.risk}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-text-secondary">{alert.name}</td>
                  <td className="px-4 py-4 text-[11px] font-mono text-text-muted truncate max-w-sm">{alert.url}</td>
                </tr>
              )
            }
          ].map((section) => (
            <details key={section.id} className="group bg-bg-elevated/20 border border-border-main rounded-2xl overflow-hidden transition-all duration-300">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 ${section.bg} rounded-xl`}>{section.icon}</div>
                  <div>
                    <h4 className="text-sm font-black text-text-primary tracking-tight">{section.name}</h4>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{section.engine}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">{section.countLabel}</p>
                    <p className="text-lg font-black text-text-primary leading-none">{section.data.length}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-main flex items-center justify-center text-text-muted group-open:rotate-180 transition-transform">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </summary>
              <div className="px-5 pb-5">
                {section.data.length === 0 ? (
                  <div className="py-10 text-center bg-bg-card/50 rounded-xl border border-dashed border-border-main">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No signals detected by {section.engine}</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border-main bg-bg-card/50 shadow-inner">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-bg-elevated/50">
                          {section.cols.map((col, i) => (
                            <th key={i} className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-widest">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.data.map((row, i) => section.renderRow(row, i))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PipelineDetailPage;
