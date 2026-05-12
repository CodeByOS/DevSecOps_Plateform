import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, BarChart3, Globe, Briefcase, ChevronDown } from 'lucide-react';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import MiniTrend from '../components/charts/MiniTrend';
import ScoreGauge from '../components/charts/ScoreGauge';
import Skeleton from '../components/ui/Skeleton';
import useProjects from '../hooks/useProjects';
import usePipelineStats from '../hooks/usePipelineStats';
import useDocumentTitle from '../hooks/useDocumentTitle';

const StatCard = ({ label, value, hint, color, icon: Icon, delay }) => (
  <Card delay={delay}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: color ?? 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{hint}</div>}
      </div>
      {Icon && (
        <div style={{ background: color ? `${color}15` : 'var(--bg-hover)', color: color ?? 'var(--text-muted)', padding: 8, borderRadius: 8 }}>
          <Icon size={20} />
        </div>
      )}
    </div>
  </Card>
);

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const DashboardPage = () => {
  useDocumentTitle('Dashboard');
  const { projects, loading: loadingProjects, error: projectsError } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(''); // Empty string means Global
  const { stats, loading: loadingStats, error: statsError } = usePipelineStats(selectedProjectId);

  const error = projectsError || statsError;

  const selectedProject = useMemo(
    () => projects.find(p => p._id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const recentData = stats?.recent ?? [];
  const trendData = recentData.length
    ? recentData.map(p => p.score ?? 0)
    : [12, 18, 22, 16, 28, 24, 19];

  const statusCounts = useMemo(() => {
    const base = { blocked: 0, completed: 0, pending: 0, running: 0, failed: 0 };
    recentData.forEach((p) => {
      if (base[p.status] !== undefined) base[p.status] += 1;
    });
    return base;
  }, [recentData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 28, fontWeight: 700 }}>Dashboard</h2>
          <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 8 }}>
            {selectedProjectId ? `Performance for ${selectedProject?.name}` : 'Global security posture across all projects'}
          </div>
        </div>
        
        {/* Styled Project Selector */}
        <div style={{ position: 'relative' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            background: 'var(--bg-elevated)', 
            padding: '10px 16px', 
            borderRadius: 12, 
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: 220
          }}>
            {selectedProjectId ? <Briefcase size={16} color="var(--blue)" /> : <Globe size={16} color="var(--purple)" />}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 600,
                flex: 1,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                fontFamily: 'inherit',
                paddingRight: 24
              }}
              disabled={loadingProjects}
            >
              <option value="">Global Overview</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 16, pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>
          {error}
        </div>
      )}

      {loadingProjects ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => (
            <Card key={i}>
              <Skeleton width="60%" height={14} style={{ marginBottom: 12 }} />
              <Skeleton width="40%" height={28} />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start receiving pipeline runs."
          action={(
            <Link to="/projects" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Go to Projects
            </Link>
          )}
        />
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <StatCard label="Total Pipelines" value={loadingStats ? '—' : stats?.total ?? 0} icon={BarChart3} delay={0} />
            <StatCard label="Blocked Runs" value={loadingStats ? '—' : stats?.blocked ?? 0} color="var(--red)" icon={ShieldAlert} delay={0.05} />
            <StatCard label="Pass Rate" value={loadingStats ? '—' : `${stats?.passRate ?? 0}%`} color="var(--green)" delay={0.1} />
            <StatCard label="Avg Risk Score" value={loadingStats ? '—' : stats?.avgScore ?? 0} hint="Lower is safer" color="var(--blue)" delay={0.15} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: 20 }}>
            <Card delay={0.2}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {selectedProjectId ? 'Project Trend' : 'Recent Pipeline Activity'}
              </div>
              {loadingStats ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Skeleton height={60} style={{ marginBottom: 8 }} />
                  {[1,2,3,4,5].map(i => <Skeleton key={i} height={50} />)}
                </div>
              ) : (stats?.recent?.length ?? 0) === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recent pipelines yet</div>
              ) : (
                <div style={{ display: 'grid', gap: 20 }}>
                  <MiniTrend data={trendData} color={selectedProjectId ? 'var(--blue)' : 'var(--purple)'} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recentData.slice().reverse().slice(0, 5).map((p) => (
                      <Link 
                        to={`/pipelines/${p._id}`}
                        key={p._id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          gap: 12, 
                          padding: '12px', 
                          background: 'var(--bg-elevated)', 
                          borderRadius: 10, 
                          border: '1px solid var(--border)',
                          textDecoration: 'none',
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{p.branch ?? 'unknown'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{p.score ?? '—'}</span>
                          <StatusBadge status={p.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {!selectedProjectId ? (
                <Card delay={0.25}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={16} color="var(--red)" /> Recent Blocked Pipelines
                  </div>
                  {loadingStats ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[1,2,3].map(i => <Skeleton key={i} height={45} />)}
                    </div>
                  ) : (stats?.recentlyBlocked?.length ?? 0) === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>No blocked pipelines recently. Good job!</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {stats.recentlyBlocked.map(p => (
                        <Link 
                          to={`/pipelines/${p._id}`}
                          key={p._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            background: 'var(--red-dim)',
                            border: '1px solid rgba(241, 122, 95, 0.2)',
                            borderRadius: 8,
                            textDecoration: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{p.project?.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500 }}>{p.branch}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{p.score}</span>
                            <StatusBadge status="blocked" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>
              ) : (
                <Card delay={0.25}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Info</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Repository</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', wordBreak: 'break-all', fontWeight: 500 }}>{selectedProject.repoUrl}</div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Default Branch</div>
                      <div className="font-mono" style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>{selectedProject.defaultBranch ?? 'main'}</div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gate Configuration</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 13, color: 'var(--orange)', textTransform: 'capitalize', fontWeight: 600 }}>
                          {selectedProject.gateConfig?.mode ?? 'block'}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>at</span>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>{selectedProject.gateConfig?.threshold ?? 80}</span>
                      </div>
                    </div>
                    <Link to={`/projects/${selectedProject._id}`} style={{ 
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      textDecoration: 'none', 
                      fontWeight: 600, 
                      marginTop: 8, 
                      fontSize: 13,
                      padding: '10px',
                      borderRadius: 8,
                      textAlign: 'center'
                    }}>
                      Manage Project
                    </Link>
                  </div>
                </Card>
              )}

              <Card delay={0.3}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Distribution</div>
                <div style={{ display: 'grid', gap: 12, fontSize: 12 }}>
                  {Object.entries(statusCounts).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 80, textTransform: 'capitalize', color: 'var(--text-muted)', fontWeight: 500 }}>{key}</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                          width: `${recentData.length ? (value / recentData.length) * 100 : 0}%`,
                          height: '100%',
                          background: key === 'blocked' || key === 'failed' ? 'var(--red)' : key === 'completed' ? 'var(--green)' : 'var(--blue)',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <span style={{ width: 32, textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: 20 }}>
            <Card delay={0.35}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Posture</div>
              <div style={{ display: 'grid', placeItems: 'center', height: 220 }}>
                <ScoreGauge score={parseFloat(stats?.avgScore ?? 0)} />
                <div style={{ textAlign: 'center', marginTop: -20 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Average risk across {selectedProjectId ? 'project' : 'platform'}</div>
                </div>
              </div>
            </Card>
            <Card delay={0.4} style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--bg-base))' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security Metrics Overview</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Vulnerability Pipeline Pass Rate</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)' }}>{stats?.passRate}%</div>
                  <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, marginTop: 12 }}>
                    <div style={{ width: `${stats?.passRate}%`, height: '100%', background: 'var(--green)', borderRadius: 2 }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Total Blocked Pipelines</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--red)' }}>{stats?.blocked}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>Critical security gates triggered</div>
                </div>
              </div>
              <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'var(--blue-dim)', color: 'var(--blue)', padding: 8, borderRadius: 8 }}>
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>Security Recommendation</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {parseFloat(stats?.avgScore) > 50 
                        ? 'High average risk detected. Consider tightening security gate thresholds.' 
                        : 'Risk levels are within acceptable limits. Maintain current security standards.'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
