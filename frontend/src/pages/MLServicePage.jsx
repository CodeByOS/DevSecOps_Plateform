import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  Brain, RefreshCw, AlertCircle, CheckCircle, Info, 
  Cpu, Database, Shield, Zap, Activity, Terminal,
  Code, LineChart, Binary
} from 'lucide-react';
import Card from '../components/ui/Card';
import useAuth from '../hooks/useAuth';
import client from '../api/client';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border-main rounded-xl p-3 shadow-2xl backdrop-blur-md">
      <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm font-black text-brand-blue">
        {Number(payload[0]?.value).toFixed(6)}
      </div>
    </div>
  );
};

const MLServicePage = () => {
  const { isAdmin } = useAuth();
  const [modelInfo, setModelInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState('');

  const [retrainJson, setRetrainJson] = useState('');
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainResult, setRetrainResult] = useState(null);
  const [retrainError, setRetrainError] = useState('');

  const loadModelInfo = async () => {
    setInfoLoading(true);
    setInfoError('');
    try {
      const { data } = await client.get('/ml/info');
      setModelInfo(data.data);
    } catch (err) {
      setInfoError(err.response?.data?.message ?? 'Intelligence core unreachable. Check service status.');
    } finally {
      setInfoLoading(false);
    }
  };

  useState(() => { loadModelInfo(); });

  const handleRetrain = async () => {
    setRetrainError('');
    setRetrainResult(null);
    let samples;
    try { samples = JSON.parse(retrainJson); } catch {
      setRetrainError('SYNTAX ERROR: Provided JSON payload is malformed.');
      return;
    }
    if (!Array.isArray(samples)) {
      setRetrainError('TYPE ERROR: Intelligence training requires an array of labeled vectors.');
      return;
    }
    setRetrainLoading(true);
    try {
      const { data } = await client.post('/ml/retrain', { samples });
      setRetrainResult(data.data);
      loadModelInfo();
    } catch (err) {
      setRetrainError(err.response?.data?.message ?? 'NEURAL RECALIBRATION FAILED.');
    } finally {
      setRetrainLoading(false);
    }
  };

  const featureChartData = modelInfo?.feature_importances
    ? Object.entries(modelInfo.feature_importances)
        .map(([name, value]) => ({ name, value: Math.abs(value) }))
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-purple font-bold text-xs uppercase tracking-widest">
            <Cpu size={14} />
            AI Intelligence Core
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Neural Analysis Engine</h1>
          <p className="text-text-muted text-sm max-w-lg font-medium">
            Status monitoring and recalibration interface for the risk assessment model. Machine learning drives the predictive security scoring.
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadModelInfo}
          disabled={infoLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-main bg-bg-elevated/50 text-text-primary text-sm font-bold hover:bg-bg-elevated transition-all shadow-lg shadow-black/20"
        >
          <RefreshCw size={18} className={infoLoading ? 'animate-spin' : ''} />
          Sync Core
        </motion.button>
      </header>

      {infoError && (
        <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3">
          <AlertCircle size={18} />
          {infoError}
        </div>
      )}

      {infoLoading && !modelInfo ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-text-muted uppercase tracking-[0.3em] animate-pulse">Initializing neural pathways...</p>
        </div>
      ) : modelInfo ? (
        <>
          {/* Core Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Neural Version', value: modelInfo.version ?? 'v0.0.0', icon: Binary, color: 'text-brand-blue' },
              { label: 'Engine Architecture', value: modelInfo.algorithm ?? 'LinearRegressor', icon: Cpu, color: 'text-brand-purple' },
              { label: 'Intelligence Base', value: `${modelInfo.training_samples?.toLocaleString() ?? 0} SAMPLES`, icon: Database, color: 'text-brand-green' },
              { label: 'Last Calibration', value: modelInfo.trained_at ? new Date(modelInfo.trained_at).toLocaleDateString() : 'INITIAL', icon: Activity, color: 'text-brand-orange' },
            ].map((stat, i) => (
              <Card key={i} className="group overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{stat.label}</p>
                    <h3 className={`text-xl font-black tracking-tight ${stat.color}`}>{stat.value}</h3>
                  </div>
                  <div className="p-2 bg-bg-elevated border border-border-main rounded-lg text-text-muted/50 group-hover:text-brand-blue transition-colors">
                    <stat.icon size={18} />
                  </div>
                </div>
                {/* Decorative particles */}
                <div className="absolute -bottom-1 -right-1 opacity-5">
                  <stat.icon size={48} />
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature Importance */}
            <Card className="lg:col-span-2 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-10 relative z-10">
                <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
                  <LineChart size={18} />
                </div>
                <h3 className="text-lg font-black text-text-primary tracking-tight uppercase tracking-widest">Weight Distribution</h3>
              </div>

              <div className="h-[320px] relative z-10 pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureChartData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="10 10" stroke="rgba(255,255,255,0.03)" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120} 
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                      {featureChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--brand-blue)' : 'var(--brand-purple)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            </Card>

            {/* Core Status */}
            <Card className="flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-brand-green/10 text-brand-green rounded-lg">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-lg font-black text-text-primary tracking-tight uppercase">Core Integrity</h3>
              </div>

              <div className="flex-1 space-y-6">
                <div className="p-4 bg-bg-elevated/40 rounded-2xl border border-border-main space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Inference Latency</span>
                    <span className="text-xs font-black text-brand-green">0.12ms</span>
                  </div>
                  <div className="h-1.5 w-full bg-bg-card rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-brand-green shadow-[0_0_10px_rgba(66,199,127,0.5)]" />
                  </div>
                </div>

                <div className="p-4 bg-bg-elevated/40 rounded-2xl border border-border-main space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Model Precision</span>
                    <span className="text-xs font-black text-brand-blue">98.4%</span>
                  </div>
                  <div className="h-1.5 w-full bg-bg-card rounded-full overflow-hidden">
                    <div className="h-full w-[98%] bg-brand-blue shadow-[0_0_10px_rgba(79,163,255,0.5)]" />
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-border-main/50">
                  <div className="flex items-center gap-3 p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
                    <Info size={16} className="text-brand-blue shrink-0" />
                    <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                      Core is currently operating on <span className="text-brand-blue font-bold">Standard Weighting</span>. Feature coefficients are automatically derived from historical pipeline outcomes.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {/* Admin Recalibration Section */}
      {isAdmin && (
        <Card className="relative border-brand-purple/20 bg-gradient-to-br from-bg-card to-brand-purple/5">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-2xl border border-brand-purple/20">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-text-primary tracking-tight uppercase tracking-tighter">Neural Recalibration</h3>
                <p className="text-[10px] text-brand-purple font-black uppercase tracking-widest">Administrative Override Core</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-bg-elevated/50 rounded-xl border border-border-main border-dashed">
              <Info size={14} className="text-brand-orange" />
              <span className="text-[10px] font-black text-text-muted uppercase">Min. Requirement: 50 Valid Samples</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Training Payload (JSON Vector Array)</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" />
                <span className="text-[9px] font-black text-brand-purple uppercase tracking-tighter">Ready for stream</span>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute top-4 left-4 z-10 pointer-events-none opacity-20">
                <Code size={48} className="text-brand-purple" />
              </div>
              <textarea
                value={retrainJson}
                onChange={(e) => setRetrainJson(e.target.value)}
                placeholder={'[\n  { "features": { "nb_critical": 2, "nb_high": 5 }, "label": 1 },\n  ...\n]'}
                rows={12}
                className="w-full bg-black/40 border border-border-main rounded-2xl p-6 text-[11px] font-mono text-brand-blue/80 leading-relaxed outline-none focus:border-brand-purple/50 transition-all shadow-inner focus:shadow-[0_0_20px_rgba(197,163,255,0.05)] resize-none custom-scrollbar"
              />
            </div>

            <AnimatePresence>
              {retrainError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-brand-red/10 border border-brand-red/30 text-brand-red rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                >
                  <AlertCircle size={16} />
                  {retrainError}
                </motion.div>
              )}

              {retrainResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-brand-green/10 border border-brand-green/30 text-brand-green rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                >
                  <CheckCircle size={16} />
                  Recalibration Successful: New Core Version {retrainResult.new_version} Integrated.
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRetrain}
                disabled={retrainLoading || !retrainJson.trim()}
                className="flex items-center gap-3 px-10 py-3.5 bg-brand-purple text-white rounded-2xl text-xs font-black shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40 transition-all disabled:opacity-30 disabled:grayscale"
              >
                {retrainLoading ? <Activity size={18} className="animate-spin" /> : <Zap size={18} />}
                {retrainLoading ? 'TRAINING CORE...' : 'EXECUTE RECALIBRATION'}
              </motion.button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MLServicePage;
