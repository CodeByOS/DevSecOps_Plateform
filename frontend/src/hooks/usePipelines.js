import { useCallback, useEffect, useState } from 'react';
import { getPipelines } from '../api/pipelines';

const usePipelines = (projectId, params = {}) => {
  const [pipelines, setPipelines] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    if (!projectId) return Promise.resolve();
    setLoading(true);
    setError('');
    return getPipelines(projectId, params)
      .then(({ data }) => {
        setPipelines(data.data ?? []);
        setMeta({ total: data.total ?? 0, page: data.page ?? 1, pages: data.pages ?? 1 });
      })
      .catch((err) => setError(err.response?.data?.message ?? 'Failed to load pipelines.'))
      .finally(() => setLoading(false));
  }, [projectId, JSON.stringify(params)]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pipelines, meta, loading, error, refresh };
};

export default usePipelines;
