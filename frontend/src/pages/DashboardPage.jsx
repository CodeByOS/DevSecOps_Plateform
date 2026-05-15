import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, BarChart3, Globe, Briefcase, ChevronDown, Activity, Zap, ShieldCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import MiniTrend from '../components/charts/MiniTrend';
import ScoreGauge from '../components/charts/ScoreGauge';
import Skeleton from '../components/ui/Skeleton';
import useProjects from '../hooks/useProjects';
import usePipelineStats from '../hooks/usePipelineStats';
import useDocumentTitle from '../hooks/useDocumentTitle';

const StatCard = ({ label, value, hint, colorClass, icon: Icon, delay }) => (
  <Card delay={delay} className="group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] mb-1">{label}</p>
        <h3 className={`text-3xl font-black tracking-tight leading-none ${colorClass ?? 'text-text-primary'}`}>{value}</h3>
        {hint && <p className="text-[11px] text-text-muted mt-2 font-medium">{hint}</p>}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-xl bg-bg-elevated border border-border-main group-hover:scale-110 transition-transform duration-300 ${colorClass?.replace('text-', 'text-') ?? 'text-text-muted'}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      )}
    </div>
    {/* Progress line at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bg-elevated overflow-hidden">
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: '0%' }}
        transition={{ duration: 1, delay: delay + 0.3 }}
        className={`h-full opacity-40 ${colorClass?.replace('text-', 'bg-') ?? 'bg-brand-blue'}`}
      />
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
  const [selectedProjectId, setSelectedProjectId] = useState(''); 
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
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-widest">
            <Activity size={14} />
            Platform Overview
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Security Command</h1>
          <p className="text-text-muted text-sm max-w-lg font-medium">
            {selectedProjectId 
              ? `Real-time security posture for project ${selectedProject?.name}.` 
              : 'Global monitoring of security gates and pipeline integrity across all repositories.'}
          </p>
        </div>
        
        <div className="relative group min-w-[240px]">
          <div className="absolute inset-0 bg-brand-blue/10 blur-xl group-hover:bg-brand-blue/20 transition-colors rounded-full" />
          <div className="relative flex items-center gap-3 bg-bg-card/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-border-main shadow-xl group-hover:border-brand-blue/50 transition-all duration-300">
            {selectedProjectId ? <Briefcase size={18} className="text-brand-blue" /> : <Globe size={18} className="text-brand-purple" />}
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-none mb-1">Scope</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent border-none text-text-primary text-sm font-bold outline-none cursor-pointer appearance-none w-full"
                disabled={loadingProjects}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <ChevronDown size={14} className="text-text-muted" />
          </div>
        </div>
      </header>

      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-brand-red/10 border border-brand-red/30 text-brand-red px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3"
        >
          <ShieldAlert size={16} />
          {error}
        </motion.div>
      )}

      {loadingProjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i}>
              <Skeleton className="w-1/2 h-3 mb-4" />
              <Skeleton className="w-3/4 h-8" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No data available"
          description="Register your first repository to begin security monitoring."
          action={(
            <Link to="/projects" className="text-brand-blue text-sm font-bold hover:underline">
              Initialize Project →
            </Link>
          )}
        />
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Executions" value={loadingStats ? '...' : stats?.total ?? 0} icon={BarChart3} delay={0} />
            <StatCard label="Blocked Assets" value={loadingStats ? '...' : stats?.blocked ?? 0} colorClass="text-brand-red" icon={ShieldAlert} delay={0.05} />
            <StatCard label="Gate Pass Rate" value={loadingStats ? '...' : `${stats?.passRate ?? 0}%`} colorClass="text-brand-green" icon={ShieldCheck} delay={0.1} />
            <StatCard label="Avg Risk Score" value={loadingStats ? '...' : stats?.avgScore ?? 0} hint="Criticality factor" colorClass="text-brand-blue" icon={Zap} delay={0.15} />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2" delay={0.2}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-text-primary tracking-tight">Security Velocity</h3>
                  <p className="text-text-muted text-xs font-medium">Pipeline results over the last 30 days</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-elevated rounded-lg border border-border-main text-[10px] font-bold text-text-muted">
                    <div className="w-2 h-2 rounded-full bg-brand-blue" />
                    Trend
                  </div>
                </div>
              </div>
              
              {loadingStats ? (
                <div className="space-y-4">
                  <Skeleton className="h-[120px] w-full" />
                  <div className="space-y-2">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                </div>
              ) : (recentData.length === 0) ? (
                <div className="h-[240px] flex items-center justify-center text-text-muted text-sm font-medium">No activity recorded</div>
              ) : (
                <div className="space-y-8">
                  <div className="h-[140px]">
                    <MiniTrend data={trendData} color={selectedProjectId ? '#4fa3ff' : '#c5a3ff'} />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Recent Runs</p>
                    {recentData.slice().reverse().slice(0, 5).map((p) => (
                      <Link 
                        to={`/pipelines/${p._id}`}
                        key={p._id} 
                        className="flex items-center justify-between gap-4 p-4 bg-bg-elevated/40 hover:bg-bg-elevated border border-border-main/50 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${p.status === 'blocked' ? 'bg-brand-red/10 text-brand-red' : 'bg-brand-blue/10 text-brand-blue'}`}>
                            <Activity size={16} />
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-bold text-text-primary truncate">{p.branch ?? 'unknown'}</span>
                            <span className="text-[10px] text-text-muted font-bold tracking-tight">{new Date(p.createdAt).toLocaleTimeString()} · {new Date(p.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right flex flex-col items-end">
                            <span className="font-mono text-sm text-text-primary font-black">{p.score ?? 0}</span>
                            <span className="text-[9px] text-text-muted font-bold uppercase">Risk Score</span>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div className="space-y-6">
              <Card delay={0.25} className="bg-brand-red/5 border-brand-red/20 shadow-brand-red/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-brand-red/10 text-brand-red rounded-lg">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-primary tracking-tight">Active Blocks</h3>
                    <p className="text-[10px] text-brand-red/70 font-bold uppercase tracking-wider">Critical Failures</p>
                  </div>
                </div>
                
                {loadingStats ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : (stats?.recentlyBlocked?.length ?? 0) === 0 ? (
                  <div className="py-8 text-center bg-bg-elevated/30 rounded-xl border border-dashed border-border-main/50">
                    <p className="text-xs text-text-muted font-medium">No blocks detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentlyBlocked.map(p => (
                      <Link 
                        to={`/pipelines/${p._id}`}
                        key={p._id}
                        className="flex items-center justify-between p-3 bg-bg-card border border-brand-red/20 rounded-xl hover:border-brand-red/40 transition-colors group"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-text-primary truncate">{p.project?.name}</span>
                          <span className="text-[10px] text-brand-red font-medium truncate italic">{p.branch}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-black text-text-primary">{p.score}</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card delay={0.3}>
                <h3 className="text-sm font-black text-text-primary tracking-tight mb-6">Execution Health</h3>
                <div className="space-y-5">
                  {Object.entries(statusCounts).map(([key, value], idx) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-text-muted">{key}</span>
                        <span className="text-text-primary">{value}</span>
                      </div>
                      <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${recentData.length ? (value / recentData.length) * 100 : 0}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + (idx * 0.1) }}
                          className={`h-full rounded-full ${
                            key === 'blocked' || key === 'failed' ? 'bg-brand-red' : 
                            key === 'completed' ? 'bg-brand-green' : 'bg-brand-blue'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card delay={0.35} className="flex flex-col items-center text-center py-10">
              <h3 className="text-lg font-black text-text-primary tracking-tight mb-2">Platform Risk Score</h3>
              <p className="text-text-muted text-xs mb-8">Aggregated security criticality level</p>
              
              <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
                <ScoreGauge score={parseFloat(stats?.avgScore ?? 0)} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                  <span className="text-4xl font-black text-text-primary tracking-tighter">{stats?.avgScore ?? 0}</span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Risk Index</span>
                </div>
              </div>
            </Card>

            <Card delay={0.4} className="bg-gradient-to-br from-bg-card to-bg-base overflow-hidden border-brand-blue/10">
              <div className="relative z-10 h-full flex flex-col">
                <div className="mb-10">
                  <h3 className="text-lg font-black text-text-primary tracking-tight mb-1">Gate Performance</h3>
                  <p className="text-text-muted text-xs">Platform-wide compliance metrics</p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Compliance Rate</p>
                    <div className="text-4xl font-black text-brand-green tracking-tighter">{stats?.passRate}%</div>
                    <div className="h-1 w-full bg-bg-elevated rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats?.passRate}%` }}
                        className="h-full bg-brand-green"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Intercepts</p>
                    <div className="text-4xl font-black text-brand-red tracking-tighter">{stats?.blocked}</div>
                    <p className="text-[10px] text-text-muted font-medium">Critical security gate triggers prevented unsafe deployments.</p>
                  </div>
                </div>

                <div className="mt-auto p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl flex gap-4 items-start">
                  <div className="p-2.5 bg-brand-blue/10 text-brand-blue rounded-xl">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary mb-1">System Intelligence Recommendation</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {parseFloat(stats?.avgScore) > 50 
                        ? 'System detected elevated risk levels. We recommend lowering the Gate Threshold by 5-10 points to enforce stricter compliance.' 
                        : 'Security posture is stable. Current gate configurations are effectively filtering threats without blocking productivity.'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
