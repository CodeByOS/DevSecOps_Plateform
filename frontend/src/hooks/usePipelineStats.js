import { useCallback, useEffect, useState } from 'react';
import { getPipelineStats } from '../api/pipelines';

const usePipelineStats = (projectId) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    if (!projectId) {
      setStats(null);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    setError('');
    return getPipelineStats(projectId)
      .then(({ data }) => setStats(data.data))
      .catch((err) => setError(err.response?.data?.message ?? 'Failed to load pipeline stats.'))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
};

export default usePipelineStats;
