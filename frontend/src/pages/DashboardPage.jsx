import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShieldAlert, BarChart3, Globe, Briefcase, ChevronDown, LayoutDashboard, Zap, Activity, ShieldCheck, Target, Check } from 'lucide-react';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import MiniTrend from '../components/charts/MiniTrend';
import ScoreGauge from '../components/charts/ScoreGauge';
import Skeleton from '../components/ui/Skeleton';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import useProjects from '../hooks/useProjects';
import usePipelineStats from '../hooks/usePipelineStats';
import useDocumentTitle from '../hooks/useDocumentTitle';

const StatCard = ({ label, value, hint, color, icon: Icon, delay }) => (
  <Card delay={delay}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: color ?? 'var(--text-primary)', letterSpacing: '-1px' }}>
          {typeof value === 'number' ? <AnimatedCounter value={value} duration={0.8} /> : value}
        </div>
        {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>{hint}</div>}
      </div>
      {Icon && (
        <div style={{ 
          background: color ? `${color}15` : 'var(--bg-elevated)', 
          color: color ?? 'var(--text-muted)', 
          padding: 12, 
          borderRadius: 12,
          border: color ? `1px solid ${color}30` : '1px solid var(--border)',
          boxShadow: color ? `0 8px 16px ${color}10` : 'none'
        }}>
          <Icon size={22} strokeWidth={2.5} />
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

/** Staggered entry animation for list items */
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }
};

const DashboardPage = () => {
  useDocumentTitle('Dashboard');
  const { projects, loading: loadingProjects, error: projectsError } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(''); // Empty string means Global
  const { stats, loading: loadingStats, error: statsError } = usePipelineStats(selectedProjectId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const error = projectsError || statsError;

  const selectedProject = useMemo(
    () => projects.find(p => p._id === selectedProjectId),
    [projects, selectedProjectId]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 14, 
            background: 'var(--blue-dim)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(79, 163, 255, 0.2)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            <LayoutDashboard size={24} color="var(--blue)" strokeWidth={2} />
          </div>
          <div>
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{ color: 'var(--text-primary)', margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', display: 'flex', gap: '0.05em' }}
            >
              {'Dashboard'.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h2>
            <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
              {selectedProjectId ? `Performance overview for ${selectedProject?.name}` : 'Global security posture across all projects'}
            </div>
          </div>
        </div>
        
        {/* Custom Project Selector Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <motion.div 
            onClick={() => !loadingProjects && setIsDropdownOpen(!isDropdownOpen)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              background: 'var(--bg-card)', 
              padding: '12px 16px', 
              borderRadius: 14, 
              border: isDropdownOpen ? '1px solid var(--blue)' : '1px solid var(--border)',
              boxShadow: isDropdownOpen ? '0 0 0 3px rgba(79, 163, 255, 0.1)' : '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: 260,
              cursor: loadingProjects ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              userSelect: 'none'
            }}
            whileHover={{ borderColor: 'var(--blue)' }}
          >
            {selectedProjectId ? <Briefcase size={18} color="var(--blue)" /> : <Globe size={18} color="var(--purple)" />}
            <span style={{ 
              color: 'var(--text-primary)', 
              fontSize: 14, 
              fontWeight: 700, 
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {selectedProjectId ? selectedProject?.name : 'Global Overview'}
            </span>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} color="var(--text-muted)" />
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 4, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  left: 0,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  marginTop: 8,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                  zIndex: 100,
                  overflow: 'hidden',
                  padding: 6
                }}
              >
                <div 
                  onClick={() => { setSelectedProjectId(''); setIsDropdownOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: selectedProjectId === '' ? 'var(--blue-dim)' : 'transparent',
                    color: selectedProjectId === '' ? 'var(--blue)' : 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if(selectedProjectId !== '') e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if(selectedProjectId !== '') e.currentTarget.style.background = 'transparent'; }}
                >
                  <Globe size={14} />
                  <span style={{ flex: 1 }}>Global Overview</span>
                  {selectedProjectId === '' && <Check size={14} />}
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0', opacity: 0.5 }}></div>

                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {projects.map((p) => (
                    <div 
                      key={p._id}
                      onClick={() => { setSelectedProjectId(p._id); setIsDropdownOpen(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: selectedProjectId === p._id ? 'var(--blue-dim)' : 'transparent',
                        color: selectedProjectId === p._id ? 'var(--blue)' : 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { if(selectedProjectId !== p._id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { if(selectedProjectId !== p._id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Briefcase size={14} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      {selectedProjectId === p._id && <Check size={14} />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
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
          description="Create your first project to start receiving pipeline runs and security insights."
          action={(
            <Link to="/projects" style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--blue)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: 12,
              textDecoration: 'none', 
              fontWeight: 700, 
              fontSize: 14,
              boxShadow: '0 4px 12px rgba(79, 163, 255, 0.3)'
            }}>
              <Zap size={16} fill="white" />
              Get Started
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            <StatCard label="Total Pipelines" value={loadingStats ? '—' : stats?.total ?? 0} icon={BarChart3} delay={0} />
            <StatCard label="Blocked Runs" value={loadingStats ? '—' : stats?.blocked ?? 0} color="var(--red)" icon={ShieldAlert} delay={0.05} />
            <StatCard label="Pass Rate" value={loadingStats ? '—' : `${stats?.passRate ?? 0}%`} color="var(--green)" icon={ShieldCheck} delay={0.1} />
            <StatCard label="Avg Risk Score" value={loadingStats ? '—' : stats?.avgScore ?? 0} hint="Lower is safer" color="var(--blue)" icon={Target} delay={0.15} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: 24 }}>
            <Card delay={0.2} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={16} color={selectedProjectId ? 'var(--blue)' : 'var(--purple)'} />
                  {selectedProjectId ? 'Project Trend' : 'Recent Activity'}
                </div>
                {!loadingStats && stats?.recent?.length > 0 && (
                   <span style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: 6, color: 'var(--text-muted)', fontWeight: 600 }}>
                    LAST {stats.recent.length} RUNS
                   </span>
                )}
              </div>
              {loadingStats ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Skeleton height={60} style={{ marginBottom: 8 }} />
                  {[1,2,3,4,5].map(i => <Skeleton key={i} height={50} />)}
                </div>
              ) : (stats?.recent?.length ?? 0) === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>No recent pipelines recorded.</div>
              ) : (
                <div style={{ display: 'grid', gap: 24 }}>
                  <MiniTrend data={trendData} color={selectedProjectId ? 'var(--blue)' : 'var(--purple)'} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentData.slice().reverse().slice(0, 5).map((p) => (
                      <Link 
                        to={`/pipelines/${p._id}`}
                        key={p._id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          gap: 12, 
                          padding: '14px', 
                          background: 'var(--bg-card)', 
                          borderRadius: 12, 
                          border: '1px solid var(--border)',
                          textDecoration: 'none',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.borderColor = 'var(--blue)';
                          e.currentTarget.style.background = 'var(--bg-hover)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.background = 'var(--bg-card)';
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700 }}>{p.branch ?? 'unknown'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{new Date(p.createdAt).toLocaleDateString()} at {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Score</div>
                            <div className="font-mono" style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800 }}>{p.score ?? '—'}</div>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {!selectedProjectId ? (
                <Card delay={0.25} style={{ border: '1px solid rgba(241, 122, 95, 0.2)', background: 'linear-gradient(135deg, var(--bg-card), var(--red-dim))' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={18} color="var(--red)" /> Recent Critical Blocks
                  </div>
                  {loadingStats ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[1,2,3].map(i => <Skeleton key={i} height={45} />)}
                    </div>
                  ) : (stats?.recentlyBlocked?.length ?? 0) === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', fontSize: 14, fontWeight: 500 }}>
                      <ShieldCheck size={32} color="var(--green)" style={{ opacity: 0.3, marginBottom: 12 }} />
                      <br />All security gates are clear.
                    </div>
                  ) : (
                    <motion.div 
                      variants={container}
                      initial="hidden"
                      animate="show"
                      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                    >
                      {stats.recentlyBlocked.map(p => (
                        <motion.div key={p._id} variants={listItem}>
                          <Link 
                            to={`/pipelines/${p._id}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid rgba(241, 122, 95, 0.3)',
                              borderRadius: 12,
                              textDecoration: 'none',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(241, 122, 95, 0.3)'}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>{p.project?.name}</span>
                              <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginTop: 2 }}>{p.branch}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>Fail Score</div>
                                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{p.score}</span>
                              </div>
                              <StatusBadge status="blocked" />
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </Card>
              ) : (
                <Card delay={0.25}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Context</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Connected Repository</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <Globe size={14} color="var(--blue)" />
                        <span style={{ wordBreak: 'break-all' }}>{selectedProject.repoUrl.replace('https://', '')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Branch</div>
                        <div className="font-mono" style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 700 }}>{selectedProject.defaultBranch ?? 'main'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gate Mode</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedProject.gateConfig?.mode === 'block' ? 'var(--red)' : 'var(--blue)' }}></div>
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                            {selectedProject.gateConfig?.mode ?? 'block'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enforcement Policy</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Min Security Score</span>
                        <span style={{ fontSize: 16, color: 'var(--blue)', fontWeight: 800 }}>{selectedProject.gateConfig?.threshold ?? 80}</span>
                      </div>
                    </div>
                    <Link to={`/projects/${selectedProject._id}`} style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      textDecoration: 'none', 
                      fontWeight: 700, 
                      fontSize: 13,
                      padding: '12px',
                      borderRadius: 12,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                    >
                      <Zap size={14} color="var(--blue)" />
                      Configure Project
                    </Link>
                  </div>
                </Card>
              )}

              <Card delay={0.3}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pipeline Status Distribution</div>
                <div style={{ display: 'grid', gap: 16, fontSize: 12 }}>
                  {Object.entries(statusCounts).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 85, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, letterSpacing: '0.5px' }}>{key}</span>
                      <div style={{ flex: 1, height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${recentData.length ? (value / recentData.length) * 100 : 0}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{
                            height: '100%',
                            background: key === 'blocked' || key === 'failed' ? 'var(--red)' : key === 'completed' ? 'var(--green)' : 'var(--blue)',
                            boxShadow: `0 0 10px ${key === 'blocked' || key === 'failed' ? 'var(--red)' : key === 'completed' ? 'var(--green)' : 'var(--blue)'}40`
                          }} 
                        />
                      </div>
                      <span style={{ width: 32, textAlign: 'right', color: 'var(--text-primary)', fontWeight: 800, fontSize: 13 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: 24 }}>
            <Card delay={0.35} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', alignSelf: 'flex-start' }}>Aggregated Risk Index</div>
              <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <ScoreGauge score={parseFloat(stats?.avgScore ?? 0)} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700 }}>Platform Security Score</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Based on {stats?.total ?? 0} historical pipeline executions</div>
              </div>
            </Card>
            
            <Card delay={0.4} style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--bg-base))', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05 }}>
                <ShieldCheck size={200} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Strategic Security Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, position: 'relative', zIndex: 1 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>Compliance Pass Rate</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--green)', letterSpacing: '-1.5px' }}>{stats?.passRate}%</div>
                  <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, marginTop: 16, border: '1px solid var(--border-subtle)' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stats?.passRate}%` }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      style={{ width: `${stats?.passRate}%`, height: '100%', background: 'var(--green)', borderRadius: 3, boxShadow: '0 0 12px var(--green)40' }} 
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>System Interventions</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--red)', letterSpacing: '-1.5px' }}>{stats?.blocked}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, fontWeight: 500 }}>Critical security gates triggered by policy violations</div>
                </div>
              </div>
              
              <div style={{ marginTop: 40, padding: 20, background: 'rgba(79, 163, 255, 0.05)', borderRadius: 16, border: '1px solid rgba(79, 163, 255, 0.2)', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: 'var(--blue-dim)', color: 'var(--blue)', padding: 10, borderRadius: 12, border: '1px solid rgba(79, 163, 255, 0.3)' }}>
                    <ShieldAlert size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700 }}>Governance Advisory</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5, fontWeight: 500 }}>
                      {parseFloat(stats?.avgScore) > 50 
                        ? 'Alert: Elevated average risk detected. It is recommended to review and tighten security gate thresholds across active projects.' 
                        : 'Security posture is stable. Current policy enforcement is effectively maintaining risk levels within acceptable enterprise standards.'}
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
