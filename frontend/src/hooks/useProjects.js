import { useCallback, useEffect, useState } from 'react';
import { getProjects } from '../api/projects';

const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    setError('');
    return getProjects()
      .then(({ data }) => setProjects(data.data ?? []))
      .catch((err) => setError(err.response?.data?.message ?? 'Failed to load projects.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { projects, setProjects, loading, error, refresh };
};

export default useProjects;
