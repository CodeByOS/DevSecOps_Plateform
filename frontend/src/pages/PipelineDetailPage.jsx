import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Shield, GitBranch, GitCommit, Clock, Share2, Check, ExternalLink, AlertTriangle, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { overridePipeline, getPipeline } from '../api/pipelines';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import ScoreGauge from '../components/charts/ScoreGauge';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import useAuth from '../hooks/useAuth';
import usePipeline from '../hooks/usePipeline';
import useToast from '../hooks/useToast';
import useDocumentTitle from '../hooks/useDocumentTitle';

/** Container animation for staggered timeline steps */
const timelineContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

/** Individual timeline step animation */
const timelineItem = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
};

const PipelineDetailPage = () => {
  const { id } = useParams();
  useDocumentTitle(`Pipeline Execution ${id?.slice(-6)}`);
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const isAdmin = user?.role === 'admin';
  const { pipeline, setPipeline, loading, error, refresh } = usePipeline(id);
  const [actionError, setActionError] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Polling for pending/running pipelines
  useEffect(() => {
    if (!pipeline || (pipeline.status !== 'pending' && pipeline.status !== 'running')) return;

    const interval = setInterval(() => {
      refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [pipeline?.status, refresh]);

  const scan = pipeline?.scanResult;
  const gateMode = pipeline?.project?.gateConfig?.mode ?? 'block';
  const gateThreshold = pipeline?.project?.gateConfig?.threshold ?? 70;
  const scoreValue = scan?.mlScore?.score ?? pipeline?.score ?? 0;
  const wouldBlock = gateMode === 'block' && scoreValue >= gateThreshold;

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

  if (loading && !pipeline) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Loading pipeline execution details…</div>;
  if (!pipeline && !loading) return <Card>Pipeline not found.</Card>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to={`/projects/${pipeline.project?._id}`} style={{ background: 'var(--bg-elevated)', padding: 8, borderRadius: 8, color: 'var(--text-muted)' }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 24, fontWeight: 700 }}>Execution Details</h2>
              <StatusBadge status={pipeline.status} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                <GitBranch size={14} /> {pipeline.branch}
              </div>
              {pipeline.commitSha && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                  <GitCommit size={14} />
                  {commitUrl ? (
                    <a href={commitUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {pipeline.commitSha.slice(0, 7)} <ExternalLink size={12} />
                    </a>
                  ) : pipeline.commitSha.slice(0, 7)}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                <Clock size={14} /> {new Date(pipeline.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={16} color="var(--green)" /> : <Share2 size={16} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {(error || actionError) && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
          {error || actionError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Card>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Final Decision</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: pipeline.decision === 'blocked' ? 'var(--red)' : pipeline.decision === 'approved' ? 'var(--green)' : 'var(--orange)' }}>
            {pipeline.decision ? pipeline.decision.toUpperCase() : 'PENDING'}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Risk Score</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: scoreValue > 70 ? 'var(--red)' : scoreValue > 40 ? 'var(--orange)' : 'var(--green)' }}>
            {scoreValue} / 100
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Gate Mode</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            {gateMode}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Threshold</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            {gateThreshold}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        <Card>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} /> Execution Timeline
          </div>
          <motion.div 
            style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
            variants={timelineContainer}
            initial="hidden"
            animate="show"
          >
            {timelineSteps.map((step, idx) => (
              <motion.div key={step.name} variants={timelineItem} style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: step.status === 'completed' ? 'var(--green)' : step.status === 'running' ? 'var(--blue)' : step.status === 'failed' ? 'var(--red)' : 'var(--bg-elevated)',
                    border: '2px solid var(--border)',
                    marginTop: 4,
                    zIndex: 2
                  }} />
                  {idx < timelineSteps.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: 'var(--border)', margin: '4px 0' }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {step.name.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {step.status.toUpperCase()} {step.durationMs ? `• ${formatDuration(step.durationMs)}` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {step.startedAt ? step.startedAt.toLocaleTimeString() : ''}
                    </div>
                  </div>
                  {step.error && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 8, border: '1px solid rgba(241, 122, 95, 0.2)', color: 'var(--red)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                      {step.error}
                    </div>
                  )}
                  {step.summary && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                      {Object.entries(step.summary).map(([key, val]) => (
                        <span key={key} style={{ marginRight: 12 }}>
                          <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key}:</span> {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card className="soft-glow">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase' }}>Risk Posture</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
              <ScoreGauge score={scoreValue} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>SAST</span>
                  <span style={{ color: scan?.sast?.critical > 0 ? 'var(--red)' : 'var(--text-primary)', fontWeight: 600 }}><AnimatedCounter value={scan?.sast?.critical ?? 0} duration={0.8} /> Crit</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>SCA</span>
                  <span style={{ color: scan?.sca?.criticalCves > 0 ? 'var(--red)' : 'var(--text-primary)', fontWeight: 600 }}><AnimatedCounter value={scan?.sca?.criticalCves ?? 0} duration={0.8} /> Crit</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>DAST</span>
                  <span style={{ color: scan?.dast?.highAlerts > 0 ? 'var(--red)' : 'var(--text-primary)', fontWeight: 600 }}><AnimatedCounter value={scan?.dast?.highAlerts ?? 0} duration={0.8} /> High</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>ML Prob</span>
                  <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{((scan?.mlScore?.probability ?? 0) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            {pipeline.status === 'blocked' && (
              <div style={{ marginTop: 20, padding: 12, background: 'var(--red-dim)', borderRadius: 10, border: '1px solid rgba(241, 122, 95, 0.2)', display: 'flex', gap: 12 }}>
                <AlertTriangle size={18} color="var(--red)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  This execution was <strong>BLOCKED</strong>. The risk score ({scoreValue}) exceeded the project threshold ({gateThreshold}).
                </div>
              </div>
            )}
            {pipeline.decision === 'override' && (
              <div style={{ marginTop: 20, padding: 12, background: 'var(--blue-dim)', borderRadius: 10, border: '1px solid rgba(79, 163, 255, 0.2)', display: 'flex', gap: 12 }}>
                <Info size={18} color="var(--blue)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <strong>ADMIN OVERRIDE</strong>: This pipeline was manually approved by {pipeline.overrideBy?.name}.
                  <div style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{pipeline.overrideReason}"</div>
                </div>
              </div>
            )}
          </Card>

          {isAdmin && pipeline.status === 'blocked' && (
            <Card>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase' }}>Security Gate Override</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                As an administrator, you can bypass the security gate. Please provide a justification.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Justification for override (e.g. False positive, Emergency fix)..."
                  style={{
                    width: '100%',
                    height: 80,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    padding: 12,
                    fontSize: 13,
                    outline: 'none',
                    resize: 'none'
                  }}
                />
                <button
                  onClick={handleOverride}
                  disabled={overrideLoading || !overrideReason.trim()}
                  style={{
                    background: 'var(--orange)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  {overrideLoading ? 'Processing Override...' : 'Approve with Override'}
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase' }}>Detailed Scan Results</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <details style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <summary style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', listStyle: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 6, background: 'rgba(79, 163, 255, 0.1)', color: 'var(--blue)', borderRadius: 6 }}><Shield size={16} /></div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>SAST (Semgrep)</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{scan?.sast?.issues?.length ?? 0} issues</span>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </summary>
            <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
              {(scan?.sast?.issues?.length ?? 0) === 0 ? (
                <div style={{ color: 'var(--text-muted)', padding: 12, fontSize: 13 }}>No SAST issues found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: 10, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Severity</th>
                      <th style={{ padding: 10, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rule</th>
                      <th style={{ padding: 10, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scan.sast.issues.map((issue, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 10, fontSize: 13 }}><span style={{ color: issue.severity === 'critical' ? 'var(--red)' : 'inherit', textTransform: 'capitalize' }}>{issue.severity}</span></td>
                        <td style={{ padding: 10, fontSize: 13 }}>{issue.ruleId}</td>
                        <td style={{ padding: 10, fontSize: 13, color: 'var(--text-secondary)' }}>{issue.filePath}:{issue.line}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>

          <details style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <summary style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', listStyle: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 6, background: 'rgba(197, 163, 255, 0.1)', color: 'var(--purple)', borderRadius: 6 }}><Shield size={16} /></div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>SCA (Dependency Check)</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{scan?.sca?.cves?.length ?? 0} CVEs</span>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </summary>
            <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
              {(scan?.sca?.cves?.length ?? 0) === 0 ? (
                <div style={{ color: 'var(--text-muted)', padding: 12, fontSize: 13 }}>No vulnerable dependencies found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: 10, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CVE ID</th>
                      <th style={{ padding: 10, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Severity</th>
                      <th style={{ padding: 10, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Package</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scan.sca.cves.map((cve, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 10, fontSize: 13, color: 'var(--purple)', fontWeight: 600 }}>{cve.cveId}</td>
                        <td style={{ padding: 10, fontSize: 13, textTransform: 'capitalize' }}>{cve.severity}</td>
                        <td style={{ padding: 10, fontSize: 13, color: 'var(--text-secondary)' }}>{cve.packageName} (fixed in {cve.fixedVersion || 'unknown'})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>

          <details style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <summary style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', listStyle: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 6, background: 'rgba(232, 168, 68, 0.1)', color: 'var(--orange)', borderRadius: 6 }}><Shield size={16} /></div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>DAST (OWASP ZAP)</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{scan?.dast?.alerts?.length ?? 0} alerts</span>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </summary>
            <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
              {(scan?.dast?.alerts?.length ?? 0) === 0 ? (
                <div style={{ color: 'var(--text-muted)', padding: 12, fontSize: 13 }}>No active security alerts found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: 10, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk</th>
                      <th style={{ padding: 10, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Alert</th>
                      <th style={{ padding: 10, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scan.dast.alerts.map((alert, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 10, fontSize: 13 }}><span style={{ color: alert.risk === 'High' ? 'var(--red)' : 'inherit' }}>{alert.risk}</span></td>
                        <td style={{ padding: 10, fontSize: 13 }}>{alert.name}</td>
                        <td style={{ padding: 10, fontSize: 13, color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>
        </div>
      </Card>
    </div>
  );
};

export default PipelineDetailPage;
