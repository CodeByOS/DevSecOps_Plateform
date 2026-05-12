import { useCallback, useEffect, useState } from 'react';
import { getPipeline } from '../api/pipelines';

const usePipeline = (pipelineId) => {
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    if (!pipelineId) return Promise.resolve();
    setLoading(true);
    setError('');
    return getPipeline(pipelineId)
      .then(({ data }) => setPipeline(data.data))
      .catch((err) => setError(err.response?.data?.message ?? 'Failed to load pipeline.'))
      .finally(() => setLoading(false));
  }, [pipelineId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pipeline, setPipeline, loading, error, refresh };
};

export default usePipeline;
