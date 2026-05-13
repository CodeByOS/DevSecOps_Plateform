import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Brain, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Card from '../components/ui/Card';
import useAuth from '../hooks/useAuth';
import client from '../api/client';

// Custom tooltip for feature importance chart
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--blue)', fontWeight: 700 }}>
        {Number(payload[0]?.value).toFixed(4)}
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
      setInfoError(err.response?.data?.message ?? 'Failed to reach ML service.');
    } finally {
      setInfoLoading(false);
    }
  };

  // Load on mount via useState initializer trick
  useState(() => { loadModelInfo(); });

  const handleRetrain = async () => {
    setRetrainError('');
    setRetrainResult(null);
    let samples;
    try {
      samples = JSON.parse(retrainJson);
    } catch {
      setRetrainError('Invalid JSON. Please paste a valid samples array.');
      return;
    }
    if (!Array.isArray(samples)) {
      setRetrainError('JSON must be an array of sample objects.');
      return;
    }
    setRetrainLoading(true);
    try {
      const { data } = await client.post('/ml/retrain', { samples });
      setRetrainResult(data.data);
      loadModelInfo();
    } catch (err) {
      setRetrainError(err.response?.data?.message ?? 'Retraining failed.');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Brain size={28} color="var(--purple)" />
            ML Service
          </h2>
          <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 8 }}>
            Risk scoring model status and management
          </div>
        </div>
        <button
          onClick={loadModelInfo}
          disabled={infoLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 16px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} style={{ animation: infoLoading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {infoError && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} />
          {infoError}
        </div>
      )}

      {infoLoading ? (
        <Card style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading model information…
        </Card>
      ) : modelInfo ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {[
              { label: 'Model Version', value: modelInfo.version ?? '—', color: 'var(--blue)' },
              { label: 'Algorithm', value: modelInfo.algorithm ?? '—', color: 'var(--purple)' },
              { label: 'Training Samples', value: modelInfo.training_samples?.toLocaleString() ?? '—', color: 'var(--green)' },
              { label: 'Trained At', value: modelInfo.trained_at ? new Date(modelInfo.trained_at).toLocaleDateString() : '—', color: 'var(--orange)' },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
              </Card>
            ))}
          </div>

          {featureChartData.length > 0 && (
            <Card>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Feature Importance (absolute coefficients)
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={featureChartData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 163, 255, 0.08)' }} />
                  <Bar dataKey="value" fill="var(--purple)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      ) : null}

      {isAdmin && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>
              Retrain Model (Admin)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--orange)', background: 'var(--orange-dim)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(232,168,68,0.2)' }}>
              <Info size={12} />
              Minimum 50 samples required
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            Paste a JSON array of labeled samples:{' '}
            <code style={{ color: 'var(--blue)', fontFamily: 'JetBrains Mono, monospace' }}>
              {'[{"features": {...}, "label": 0|1}]'}
            </code>
          </div>

          <textarea
            value={retrainJson}
            onChange={(e) => setRetrainJson(e.target.value)}
            placeholder={'[\n  { "features": { "nb_critical": 2, "nb_high": 5, ... }, "label": 1 },\n  ...\n]'}
            rows={10}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--purple)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />

          {retrainError && (
            <div style={{ marginTop: 12, background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} />
              {retrainError}
            </div>
          )}

          {retrainResult && (
            <div style={{ marginTop: 12, background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={14} />
              Retrained! New version: <strong style={{ marginLeft: 4 }}>{retrainResult.new_version}</strong> using {retrainResult.samples_used} samples.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={handleRetrain}
              disabled={retrainLoading || !retrainJson.trim()}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: retrainLoading || !retrainJson.trim() ? 'var(--border)' : 'var(--purple)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: retrainLoading || !retrainJson.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Brain size={16} />
              {retrainLoading ? 'Retraining…' : 'Start Retraining'}
            </button>
          </div>
        </Card>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MLServicePage;
